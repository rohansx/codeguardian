/**
 * CodeGuardian - The Essential Code Quality Tool
 *
 * Main exports for programmatic usage
 */

export { Analyzer } from './analyzer';
export { ConfigManager } from './config';
export { Parser } from './parser';
export { UnusedImportsDetector } from './detectors/unused-imports';
export { UnusedDependenciesDetector } from './detectors/unused-dependencies';
export { ComplexityAnalyzer } from './analyzers/complexity';
export { AutoFixer } from './fixer';
export { ConsoleReporter } from './reporters/console-reporter';
export { JSONReporter } from './reporters/json-reporter';

export * from './types';
