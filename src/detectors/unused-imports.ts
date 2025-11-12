/**
 * Unused imports detector
 */

import * as path from 'path';
import fg from 'fast-glob';
import { Parser } from '../parser';
import { UnusedImport, CodeGuardianConfig } from '../types';

export class UnusedImportsDetector {
  private parser: Parser;
  private config: CodeGuardianConfig;

  constructor(config: CodeGuardianConfig) {
    this.parser = new Parser();
    this.config = config;
  }

  /**
   * Detect unused imports in the project
   */
  async detect(projectRoot: string): Promise<UnusedImport[]> {
    const srcDir = path.join(projectRoot, this.config.srcDir || 'src');
    const patterns = this.config.include || ['**/*.{ts,tsx,js,jsx}'];

    // Find all source files
    const files = await fg(patterns, {
      cwd: srcDir,
      ignore: this.config.exclude || [],
      absolute: true,
    });

    const allUnusedImports: UnusedImport[] = [];

    // Analyze each file
    for (const file of files) {
      try {
        const unusedImports = this.parser.findUnusedImports(file);
        allUnusedImports.push(...unusedImports);
      } catch (error) {
        if (this.config.verbose) {
          console.error(`Error analyzing ${file}:`, error);
        }
      }
    }

    return allUnusedImports;
  }

  /**
   * Group unused imports by file
   */
  groupByFile(unusedImports: UnusedImport[]): Map<string, UnusedImport[]> {
    const grouped = new Map<string, UnusedImport[]>();

    unusedImports.forEach((imp) => {
      const existing = grouped.get(imp.file) || [];
      existing.push(imp);
      grouped.set(imp.file, existing);
    });

    return grouped;
  }

  /**
   * Get statistics
   */
  getStats(unusedImports: UnusedImport[]) {
    const grouped = this.groupByFile(unusedImports);
    const affectedFiles = grouped.size;
    const totalUnused = unusedImports.length;

    // Calculate potential bundle size reduction
    // Rough estimate: 1KB per unused import on average
    const estimatedSizeReduction = totalUnused * 1;

    return {
      affectedFiles,
      totalUnused,
      estimatedSizeReduction,
    };
  }
}
