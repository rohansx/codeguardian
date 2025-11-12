/**
 * Main analyzer that coordinates all detection and analysis
 */

import { ConfigManager } from './config';
import { UnusedImportsDetector } from './detectors/unused-imports';
import { UnusedDependenciesDetector } from './detectors/unused-dependencies';
import { ComplexityAnalyzer } from './analyzers/complexity';
import { AnalysisResult } from './types';

export class Analyzer {
  private configManager: ConfigManager;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configManager = new ConfigManager(projectRoot);
  }

  /**
   * Run complete analysis
   */
  async analyze(): Promise<AnalysisResult> {
    const config = this.configManager.getConfig();

    // Initialize result
    const result: AnalysisResult = {
      unusedImports: [],
      unusedDependencies: [],
      unusedExports: [],
      unusedFiles: [],
      complexity: [],
      totalFiles: 0,
      totalImports: 0,
      totalDependencies: 0,
      estimatedBundleSizeReduction: 0,
      estimatedCleanupTime: 0,
    };

    // Detect unused imports
    if (config.analyzeUnusedImports) {
      const detector = new UnusedImportsDetector(config);
      result.unusedImports = await detector.detect(this.projectRoot);
    }

    // Detect unused dependencies
    if (config.analyzeUnusedDependencies) {
      const detector = new UnusedDependenciesDetector(config);
      result.unusedDependencies = await detector.detect(this.projectRoot);
    }

    // Analyze complexity
    const complexityAnalyzer = new ComplexityAnalyzer(config);
    result.complexity = await complexityAnalyzer.analyze(this.projectRoot);

    // Calculate statistics
    result.totalFiles = result.complexity.length;
    result.totalImports = result.unusedImports.length;
    result.totalDependencies = result.unusedDependencies.length;

    // Estimate bundle size reduction (rough estimates)
    // Unused imports: ~1KB each
    // Unused dependencies: ~50KB average
    result.estimatedBundleSizeReduction =
      result.unusedImports.length * 1 + result.unusedDependencies.length * 50;

    // Estimate cleanup time (rough estimates)
    // Unused imports: ~1 min per 10 imports
    // Unused dependencies: ~2 min per dependency
    result.estimatedCleanupTime =
      Math.ceil(result.unusedImports.length / 10) +
      result.unusedDependencies.length * 2;

    return result;
  }

  /**
   * Get project information
   */
  getProjectInfo() {
    return this.configManager.getProjectInfo();
  }

  /**
   * Get configuration
   */
  getConfig() {
    return this.configManager.getConfig();
  }

  /**
   * Initialize configuration file
   */
  initConfig() {
    this.configManager.initConfig();
  }
}
