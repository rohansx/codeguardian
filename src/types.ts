/**
 * Core types for CodeGuardian
 */

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'nextjs' | 'nuxt' | 'unknown';

export type BuildTool = 'webpack' | 'vite' | 'rollup' | 'parcel' | 'esbuild' | 'unknown';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';

export interface CodeGuardianConfig {
  // Project detection
  framework?: Framework;
  buildTool?: BuildTool;
  packageManager?: PackageManager;

  // Paths
  srcDir?: string;
  exclude?: string[];
  include?: string[];

  // Analysis options
  analyzeUnusedImports?: boolean;
  analyzeUnusedDependencies?: boolean;
  analyzeUnusedExports?: boolean;
  analyzeUnusedFiles?: boolean;
  analyzeUnusedCSS?: boolean;

  // Safety options
  safeMode?: boolean;
  requireTests?: boolean;
  autoFix?: boolean;

  // Reporting
  verbose?: boolean;
  outputFormat?: 'text' | 'json' | 'html';

  // Thresholds
  complexityThreshold?: number;
  confidenceThreshold?: number;
}

export interface UnusedImport {
  file: string;
  line: number;
  column: number;
  importName: string;
  source: string;
  confidence: number;
}

export interface UnusedDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  confidence: number;
  reason: string;
}

export interface UnusedExport {
  file: string;
  line: number;
  exportName: string;
  exportType: 'named' | 'default';
  confidence: number;
}

export interface UnusedFile {
  path: string;
  size: number;
  lastModified: Date;
  confidence: number;
  reason: string;
}

export interface CodeComplexity {
  file: string;
  complexity: number;
  loc: number;
  functions: number;
}

export interface AnalysisResult {
  unusedImports: UnusedImport[];
  unusedDependencies: UnusedDependency[];
  unusedExports: UnusedExport[];
  unusedFiles: UnusedFile[];
  complexity: CodeComplexity[];

  // Metrics
  totalFiles: number;
  totalImports: number;
  totalDependencies: number;

  // Estimates
  estimatedBundleSizeReduction: number; // in KB
  estimatedCleanupTime: number; // in minutes
}

export interface FixResult {
  success: boolean;
  filesModified: string[];
  importsRemoved: number;
  dependenciesRemoved: string[];
  errors: string[];
}

export interface ProjectInfo {
  name: string;
  version: string;
  framework: Framework;
  buildTool: BuildTool;
  packageManager: PackageManager;
  hasTests: boolean;
  testFramework?: string;
}
