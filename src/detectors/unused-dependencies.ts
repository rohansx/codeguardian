/**
 * Unused dependencies detector
 */

import * as path from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import { UnusedDependency, CodeGuardianConfig } from '../types';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export class UnusedDependenciesDetector {
  private config: CodeGuardianConfig;

  constructor(config: CodeGuardianConfig) {
    this.config = config;
  }

  /**
   * Detect unused dependencies in package.json
   */
  async detect(projectRoot: string): Promise<UnusedDependency[]> {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson: PackageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8')
    );

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Get all source files
    const srcDir = path.join(projectRoot, this.config.srcDir || 'src');
    const patterns = this.config.include || ['**/*.{ts,tsx,js,jsx}'];

    const files = await fg(patterns, {
      cwd: srcDir,
      ignore: this.config.exclude || [],
      absolute: true,
    });

    // Also check config files
    const configFiles = await fg(['*.{js,ts,json}', '.*.{js,ts}'], {
      cwd: projectRoot,
      absolute: true,
      dot: true,
    });

    const allFiles = [...files, ...configFiles];

    // Find all imported packages
    const usedPackages = new Set<string>();

    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        this.extractImports(content, usedPackages);
      } catch (error) {
        // Ignore read errors
      }
    }

    const unusedDependencies: UnusedDependency[] = [];

    // Check regular dependencies
    for (const [name, version] of Object.entries(dependencies)) {
      if (!this.isPackageUsed(name, usedPackages)) {
        unusedDependencies.push({
          name,
          version,
          type: 'dependency',
          confidence: 0.85,
          reason: 'Not imported in any source file',
        });
      }
    }

    // Check dev dependencies
    for (const [name, version] of Object.entries(devDependencies)) {
      // Skip known build tools and testing frameworks (they might not be explicitly imported)
      if (this.isKnownToolPackage(name)) {
        continue;
      }

      if (!this.isPackageUsed(name, usedPackages)) {
        unusedDependencies.push({
          name,
          version,
          type: 'devDependency',
          confidence: 0.75, // Lower confidence for devDeps
          reason: 'Not imported in any source file',
        });
      }
    }

    return unusedDependencies;
  }

  /**
   * Extract import statements from code
   */
  private extractImports(content: string, usedPackages: Set<string>): void {
    // Match ES6 imports: import ... from '...'
    const es6ImportRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const packageName = this.extractPackageName(importPath);
      if (packageName) {
        usedPackages.add(packageName);
      }
    }

    // Match require: require('...')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const packageName = this.extractPackageName(importPath);
      if (packageName) {
        usedPackages.add(packageName);
      }
    }

    // Match dynamic imports: import('...')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const packageName = this.extractPackageName(importPath);
      if (packageName) {
        usedPackages.add(packageName);
      }
    }
  }

  /**
   * Extract package name from import path
   */
  private extractPackageName(importPath: string): string | null {
    // Skip relative imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return null;
    }

    // Handle scoped packages (@org/package)
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
      return parts[0];
    }

    // Handle regular packages
    const parts = importPath.split('/');
    return parts[0];
  }

  /**
   * Check if a package is used
   */
  private isPackageUsed(packageName: string, usedPackages: Set<string>): boolean {
    // Direct match
    if (usedPackages.has(packageName)) {
      return true;
    }

    // Check for sub-packages (e.g., @babel/core used when @babel/parser is imported)
    if (packageName.includes('/')) {
      const basePackage = packageName.split('/')[0];
      for (const used of usedPackages) {
        if (used.startsWith(basePackage + '/')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a package is a known tool that might not be explicitly imported
   */
  private isKnownToolPackage(name: string): boolean {
    const knownTools = [
      'typescript',
      'eslint',
      'prettier',
      'webpack',
      'vite',
      'rollup',
      'jest',
      'vitest',
      'mocha',
      'chai',
      '@types/',
      'ts-node',
      'nodemon',
      'rimraf',
      'cross-env',
    ];

    return knownTools.some((tool) => name.startsWith(tool) || name === tool);
  }

  /**
   * Get statistics
   */
  getStats(unusedDeps: UnusedDependency[]) {
    const deps = unusedDeps.filter((d) => d.type === 'dependency');
    const devDeps = unusedDeps.filter((d) => d.type === 'devDependency');

    return {
      totalUnused: unusedDeps.length,
      unusedDependencies: deps.length,
      unusedDevDependencies: devDeps.length,
    };
  }
}
