/**
 * Configuration management with auto-detection
 */

import { cosmiconfigSync } from 'cosmiconfig';
import * as fs from 'fs';
import * as path from 'path';
import { CodeGuardianConfig, Framework, BuildTool, PackageManager, ProjectInfo } from './types';

const DEFAULT_CONFIG: CodeGuardianConfig = {
  srcDir: 'src',
  exclude: ['node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt'],
  include: ['**/*.{ts,tsx,js,jsx,vue,svelte}'],
  analyzeUnusedImports: true,
  analyzeUnusedDependencies: true,
  analyzeUnusedExports: true,
  analyzeUnusedFiles: false,
  analyzeUnusedCSS: false,
  safeMode: true,
  requireTests: false,
  autoFix: false,
  verbose: false,
  outputFormat: 'text',
  complexityThreshold: 10,
  confidenceThreshold: 0.8,
};

export class ConfigManager {
  private config: CodeGuardianConfig;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.config = this.loadConfig();
  }

  private loadConfig(): CodeGuardianConfig {
    // Try to load user config
    const explorer = cosmiconfigSync('codeguardian');
    const result = explorer.search(this.projectRoot);

    const userConfig = result ? result.config : {};

    // Merge with defaults
    return { ...DEFAULT_CONFIG, ...userConfig };
  }

  getConfig(): CodeGuardianConfig {
    return this.config;
  }

  updateConfig(updates: Partial<CodeGuardianConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Auto-detect framework from package.json
   */
  detectFramework(): Framework {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return 'unknown';
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.next || deps['next/core']) return 'nextjs';
      if (deps.nuxt) return 'nuxt';
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps['@angular/core']) return 'angular';
      if (deps.svelte) return 'svelte';

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Auto-detect build tool
   */
  detectBuildTool(): BuildTool {
    const files = fs.readdirSync(this.projectRoot);

    if (files.includes('vite.config.js') || files.includes('vite.config.ts')) return 'vite';
    if (files.includes('webpack.config.js') || files.includes('webpack.config.ts')) return 'webpack';
    if (files.includes('rollup.config.js') || files.includes('rollup.config.ts')) return 'rollup';
    if (files.includes('.parcelrc')) return 'parcel';
    if (files.includes('esbuild.config.js')) return 'esbuild';

    return 'unknown';
  }

  /**
   * Auto-detect package manager
   */
  detectPackageManager(): PackageManager {
    const files = fs.readdirSync(this.projectRoot);

    if (files.includes('pnpm-lock.yaml')) return 'pnpm';
    if (files.includes('yarn.lock')) return 'yarn';
    if (files.includes('bun.lockb')) return 'bun';
    if (files.includes('package-lock.json')) return 'npm';

    return 'npm'; // default fallback
  }

  /**
   * Detect test framework
   */
  detectTestFramework(): string | undefined {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.jest) return 'jest';
      if (deps.vitest) return 'vitest';
      if (deps.mocha) return 'mocha';
      if (deps['@playwright/test']) return 'playwright';
      if (deps.cypress) return 'cypress';

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get complete project info
   */
  getProjectInfo(): ProjectInfo {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    let name = 'unknown';
    let version = '0.0.0';

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        name = packageJson.name || 'unknown';
        version = packageJson.version || '0.0.0';
      } catch (error) {
        // ignore
      }
    }

    const testFramework = this.detectTestFramework();

    return {
      name,
      version,
      framework: this.detectFramework(),
      buildTool: this.detectBuildTool(),
      packageManager: this.detectPackageManager(),
      hasTests: testFramework !== undefined,
      testFramework,
    };
  }

  /**
   * Initialize config file
   */
  initConfig(): void {
    const configPath = path.join(this.projectRoot, '.codeguardianrc.json');

    if (fs.existsSync(configPath)) {
      throw new Error('Config file already exists');
    }

    const projectInfo = this.getProjectInfo();

    const config: CodeGuardianConfig = {
      ...DEFAULT_CONFIG,
      framework: projectInfo.framework,
      buildTool: projectInfo.buildTool,
      packageManager: projectInfo.packageManager,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}
