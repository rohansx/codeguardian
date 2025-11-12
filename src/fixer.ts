/**
 * Auto-fixer for safely removing unused code
 */

import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResult, FixResult } from './types';

interface FixerOptions {
  safeMode?: boolean;
  requireTests?: boolean;
}

export class AutoFixer {
  private options: FixerOptions;

  constructor(options: FixerOptions = {}) {
    this.options = {
      safeMode: true,
      requireTests: false,
      ...options,
    };
  }

  /**
   * Fix unused code issues
   */
  async fix(result: AnalysisResult): Promise<FixResult> {
    const fixResult: FixResult = {
      success: true,
      filesModified: [],
      importsRemoved: 0,
      dependenciesRemoved: [],
      errors: [],
    };

    try {
      // Fix unused imports
      await this.fixUnusedImports(result, fixResult);

      // Fix unused dependencies
      await this.fixUnusedDependencies(result, fixResult);

      // Run tests if required
      if (this.options.requireTests && fixResult.filesModified.length > 0) {
        const testsPass = await this.runTests();
        if (!testsPass) {
          fixResult.success = false;
          fixResult.errors.push('Tests failed after cleanup');
          // Rollback changes
          await this.rollback(fixResult.filesModified);
        }
      }
    } catch (error) {
      fixResult.success = false;
      if (error instanceof Error) {
        fixResult.errors.push(error.message);
      }
    }

    return fixResult;
  }

  /**
   * Fix unused imports
   */
  private async fixUnusedImports(
    result: AnalysisResult,
    fixResult: FixResult
  ): Promise<void> {
    // Group by file
    const byFile = new Map<string, typeof result.unusedImports>();
    result.unusedImports.forEach((imp) => {
      // Skip if confidence is too low in safe mode
      if (this.options.safeMode && imp.confidence < 0.8) {
        return;
      }

      const list = byFile.get(imp.file) || [];
      list.push(imp);
      byFile.set(imp.file, list);
    });

    // Process each file
    for (const [filePath, imports] of byFile.entries()) {
      try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        let modified = false;

        // Sort imports by line number (descending) to avoid line number shifts
        const sortedImports = imports.sort((a, b) => b.line - a.line);

        for (const imp of sortedImports) {
          const lineIndex = imp.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];

            // Check if this line contains the import
            if (line.includes(imp.importName) && line.includes(imp.source)) {
              // Remove the entire import line if it only contains this import
              if (this.isOnlyImportOnLine(line, imp.importName)) {
                lines.splice(lineIndex, 1);
                modified = true;
                fixResult.importsRemoved++;
              } else {
                // Remove just this import from the line
                const newLine = this.removeImportFromLine(line, imp.importName);
                if (newLine !== line) {
                  lines[lineIndex] = newLine;
                  modified = true;
                  fixResult.importsRemoved++;
                }
              }
            }
          }
        }

        if (modified) {
          fs.writeFileSync(filePath, lines.join('\n'));
          fixResult.filesModified.push(filePath);
        }
      } catch (error) {
        fixResult.errors.push(`Failed to fix imports in ${filePath}`);
      }
    }
  }

  /**
   * Check if an import is the only one on a line
   */
  private isOnlyImportOnLine(line: string, importName: string): boolean {
    // Simple heuristic: check if removing this import would leave an empty import
    const withoutImport = line.replace(importName, '').replace(/,\s*,/g, ',');
    return withoutImport.match(/import\s+{\s*}\s+from/) !== null ||
      withoutImport.match(/import\s+from/) !== null;
  }

  /**
   * Remove a specific import from a line
   */
  private removeImportFromLine(line: string, importName: string): string {
    // Handle different import patterns
    // import { foo, bar } from 'module' -> import { bar } from 'module'
    // import foo, { bar } from 'module' -> import { bar } from 'module'
    // import foo from 'module' -> remove entire line

    // Replace the import name and clean up commas
    let result = line
      .replace(new RegExp(`\\b${importName}\\b,?\\s*`, 'g'), '')
      .replace(/,\s*}/g, ' }')
      .replace(/{\s*,/g, '{ ')
      .replace(/,\s*,/g, ',');

    return result;
  }

  /**
   * Fix unused dependencies
   */
  private async fixUnusedDependencies(
    result: AnalysisResult,
    fixResult: FixResult
  ): Promise<void> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      let modified = false;

      result.unusedDependencies.forEach((dep) => {
        // Skip if confidence is too low in safe mode
        if (this.options.safeMode && dep.confidence < 0.8) {
          return;
        }

        if (dep.type === 'dependency' && packageJson.dependencies?.[dep.name]) {
          delete packageJson.dependencies[dep.name];
          modified = true;
          fixResult.dependenciesRemoved.push(dep.name);
        } else if (
          dep.type === 'devDependency' &&
          packageJson.devDependencies?.[dep.name]
        ) {
          delete packageJson.devDependencies[dep.name];
          modified = true;
          fixResult.dependenciesRemoved.push(dep.name);
        }
      });

      if (modified) {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + '\n'
        );
        fixResult.filesModified.push(packageJsonPath);
      }
    } catch (error) {
      fixResult.errors.push('Failed to fix dependencies in package.json');
    }
  }

  /**
   * Run tests
   */
  private async runTests(): Promise<boolean> {
    // TODO: Implement test runner
    // This would detect the test framework and run tests
    return true;
  }

  /**
   * Rollback changes
   */
  private async rollback(files: string[]): Promise<void> {
    // TODO: Implement rollback using git or backup files
    console.warn('Rollback not yet implemented');
  }
}
