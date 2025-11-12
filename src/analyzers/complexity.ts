/**
 * Code complexity analyzer
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import fg from 'fast-glob';
import * as path from 'path';
import { CodeComplexity, CodeGuardianConfig } from '../types';

export class ComplexityAnalyzer {
  private config: CodeGuardianConfig;

  constructor(config: CodeGuardianConfig) {
    this.config = config;
  }

  /**
   * Analyze complexity for all files
   */
  async analyze(projectRoot: string): Promise<CodeComplexity[]> {
    const srcDir = path.join(projectRoot, this.config.srcDir || 'src');
    const patterns = this.config.include || ['**/*.{ts,tsx,js,jsx}'];

    const files = await fg(patterns, {
      cwd: srcDir,
      ignore: this.config.exclude || [],
      absolute: true,
    });

    const results: CodeComplexity[] = [];

    for (const file of files) {
      try {
        const complexity = this.analyzeFile(file);
        if (complexity) {
          results.push(complexity);
        }
      } catch (error) {
        if (this.config.verbose) {
          console.error(`Error analyzing complexity for ${file}:`, error);
        }
      }
    }

    // Sort by complexity (highest first)
    return results.sort((a, b) => b.complexity - a.complexity);
  }

  /**
   * Analyze complexity for a single file
   */
  analyzeFile(filePath: string): CodeComplexity | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const loc = content.split('\n').length;

      // Determine file type
      const isTSX = filePath.endsWith('.tsx');
      const isTS = filePath.endsWith('.ts') || isTSX;
      const isJSX = filePath.endsWith('.jsx') || isTSX;

      const plugins: parser.ParserPlugin[] = ['classProperties', 'decorators-legacy'];

      if (isTS) {
        plugins.push('typescript');
      }

      if (isJSX || isTSX) {
        plugins.push('jsx');
      }

      let ast;
      try {
        ast = parser.parse(content, {
          sourceType: 'module',
          plugins,
        });
      } catch (error) {
        ast = parser.parse(content, {
          sourceType: 'unambiguous',
          plugins,
        });
      }

      let complexity = 0;
      let functions = 0;

      traverse(ast, {
        // Count decision points
        IfStatement() {
          complexity++;
        },
        ForStatement() {
          complexity++;
        },
        WhileStatement() {
          complexity++;
        },
        DoWhileStatement() {
          complexity++;
        },
        SwitchCase(path) {
          // Each case adds complexity
          if (path.node.test !== null) {
            complexity++;
          }
        },
        ConditionalExpression() {
          complexity++;
        },
        LogicalExpression() {
          complexity++;
        },
        CatchClause() {
          complexity++;
        },

        // Count functions
        FunctionDeclaration() {
          functions++;
          complexity++; // Each function adds 1 to base complexity
        },
        FunctionExpression() {
          functions++;
          complexity++;
        },
        ArrowFunctionExpression() {
          functions++;
          complexity++;
        },
      });

      return {
        file: filePath,
        complexity,
        loc,
        functions,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get high complexity files (hotspots)
   */
  getHotspots(complexities: CodeComplexity[]): CodeComplexity[] {
    const threshold = this.config.complexityThreshold || 10;
    return complexities.filter((c) => c.complexity > threshold);
  }

  /**
   * Get statistics
   */
  getStats(complexities: CodeComplexity[]) {
    if (complexities.length === 0) {
      return {
        totalFiles: 0,
        averageComplexity: 0,
        maxComplexity: 0,
        totalLOC: 0,
        hotspots: 0,
      };
    }

    const totalComplexity = complexities.reduce((sum, c) => sum + c.complexity, 0);
    const totalLOC = complexities.reduce((sum, c) => sum + c.loc, 0);
    const maxComplexity = Math.max(...complexities.map((c) => c.complexity));
    const hotspots = this.getHotspots(complexities).length;

    return {
      totalFiles: complexities.length,
      averageComplexity: Math.round(totalComplexity / complexities.length),
      maxComplexity,
      totalLOC,
      hotspots,
    };
  }
}
