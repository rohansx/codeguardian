/**
 * Console reporter for beautiful terminal output
 */

import chalk from 'chalk';
import { AnalysisResult, ProjectInfo } from '../types';

export class ConsoleReporter {
  /**
   * Report analysis results to console
   */
  report(result: AnalysisResult, projectInfo?: ProjectInfo): void {
    console.log('\n' + chalk.bold.cyan('📊 CodeGuardian Analysis Report') + '\n');

    // Project info
    if (projectInfo) {
      this.reportProjectInfo(projectInfo);
    }

    // Summary
    this.reportSummary(result);

    // Unused imports
    if (result.unusedImports.length > 0) {
      this.reportUnusedImports(result);
    }

    // Unused dependencies
    if (result.unusedDependencies.length > 0) {
      this.reportUnusedDependencies(result);
    }

    // Complexity
    if (result.complexity.length > 0) {
      this.reportComplexity(result);
    }

    // Recommendations
    this.reportRecommendations(result);

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  }

  private reportProjectInfo(info: ProjectInfo): void {
    console.log(chalk.bold('Project Information:'));
    console.log(`  Name: ${chalk.cyan(info.name)}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  Framework: ${this.getFrameworkBadge(info.framework)}`);
    console.log(`  Build Tool: ${chalk.yellow(info.buildTool)}`);
    console.log(`  Package Manager: ${chalk.yellow(info.packageManager)}`);
    console.log(
      `  Tests: ${info.hasTests ? chalk.green('✓') : chalk.red('✗')} ${
        info.testFramework ? `(${info.testFramework})` : ''
      }`
    );
    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  }

  private reportSummary(result: AnalysisResult): void {
    console.log(chalk.bold('Summary:'));
    console.log(`  Total Files Analyzed: ${chalk.cyan(result.totalFiles)}`);
    console.log(
      `  Unused Imports: ${this.getStatusBadge(result.unusedImports.length)}`
    );
    console.log(
      `  Unused Dependencies: ${this.getStatusBadge(result.unusedDependencies.length)}`
    );
    console.log(
      `  Estimated Bundle Size Reduction: ${chalk.green(
        result.estimatedBundleSizeReduction + ' KB'
      )}`
    );
    console.log(
      `  Estimated Cleanup Time: ${chalk.yellow(
        result.estimatedCleanupTime + ' minutes'
      )}`
    );
    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  }

  private reportUnusedImports(result: AnalysisResult): void {
    console.log(chalk.bold.yellow('⚠️  Unused Imports:') + '\n');

    // Group by file
    const byFile = new Map<string, typeof result.unusedImports>();
    result.unusedImports.forEach((imp) => {
      const list = byFile.get(imp.file) || [];
      list.push(imp);
      byFile.set(imp.file, list);
    });

    // Show top 10 files
    const entries = Array.from(byFile.entries()).slice(0, 10);

    entries.forEach(([file, imports]) => {
      console.log(chalk.cyan(`  ${this.shortenPath(file)}:`));
      imports.forEach((imp) => {
        console.log(
          chalk.gray(`    Line ${imp.line}: `) +
            chalk.red(imp.importName) +
            chalk.gray(` from '${imp.source}'`)
        );
      });
      console.log();
    });

    if (byFile.size > 10) {
      console.log(
        chalk.gray(
          `  ... and ${byFile.size - 10} more files with unused imports\n`
        )
      );
    }
  }

  private reportUnusedDependencies(result: AnalysisResult): void {
    console.log(chalk.bold.yellow('⚠️  Unused Dependencies:') + '\n');

    const deps = result.unusedDependencies.filter((d) => d.type === 'dependency');
    const devDeps = result.unusedDependencies.filter(
      (d) => d.type === 'devDependency'
    );

    if (deps.length > 0) {
      console.log(chalk.bold('  Dependencies:'));
      deps.forEach((dep) => {
        console.log(
          `    ${chalk.red('•')} ${chalk.cyan(dep.name)} ${chalk.gray(
            `(${dep.version})`
          )}`
        );
        console.log(chalk.gray(`      ${dep.reason}`));
      });
      console.log();
    }

    if (devDeps.length > 0) {
      console.log(chalk.bold('  Dev Dependencies:'));
      devDeps.forEach((dep) => {
        console.log(
          `    ${chalk.yellow('•')} ${chalk.cyan(dep.name)} ${chalk.gray(
            `(${dep.version})`
          )}`
        );
        console.log(chalk.gray(`      ${dep.reason}`));
      });
      console.log();
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');
  }

  private reportComplexity(result: AnalysisResult): void {
    // Get top 5 most complex files
    const topComplex = result.complexity.slice(0, 5);

    if (topComplex.length === 0) return;

    console.log(chalk.bold.magenta('🔥 Complexity Hotspots:') + '\n');

    topComplex.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${chalk.cyan(this.shortenPath(item.file))}`
      );
      console.log(
        `     Complexity: ${this.getComplexityBadge(item.complexity)} | ` +
          `LOC: ${chalk.gray(item.loc)} | ` +
          `Functions: ${chalk.gray(item.functions)}`
      );
    });

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
  }

  private reportRecommendations(result: AnalysisResult): void {
    console.log(chalk.bold.green('💡 Recommendations:') + '\n');

    const recommendations: string[] = [];

    if (result.unusedImports.length > 0) {
      recommendations.push(
        `Remove ${result.unusedImports.length} unused imports to reduce bundle size`
      );
    }

    if (result.unusedDependencies.length > 0) {
      recommendations.push(
        `Remove ${result.unusedDependencies.length} unused dependencies to speed up installs`
      );
    }

    if (result.complexity.length > 0) {
      const highComplexity = result.complexity.filter((c) => c.complexity > 20);
      if (highComplexity.length > 0) {
        recommendations.push(
          `Refactor ${highComplexity.length} high-complexity files for better maintainability`
        );
      }
    }

    if (recommendations.length === 0) {
      console.log(chalk.green('  ✓ Your codebase looks clean!'));
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.gray('  Run with --fix to automatically remove unused imports'));
    console.log(chalk.gray('  Run with --interactive for guided cleanup'));
  }

  private getStatusBadge(count: number): string {
    if (count === 0) {
      return chalk.green('0 ✓');
    } else if (count < 10) {
      return chalk.yellow(count.toString());
    } else {
      return chalk.red(count.toString());
    }
  }

  private getComplexityBadge(complexity: number): string {
    if (complexity < 10) {
      return chalk.green(complexity.toString());
    } else if (complexity < 20) {
      return chalk.yellow(complexity.toString());
    } else {
      return chalk.red(complexity.toString());
    }
  }

  private getFrameworkBadge(framework: string): string {
    const badges: Record<string, string> = {
      react: '⚛️  React',
      vue: '💚 Vue',
      angular: '🅰️  Angular',
      svelte: '🧡 Svelte',
      nextjs: '▲ Next.js',
      nuxt: '💚 Nuxt',
      unknown: '❓ Unknown',
    };

    return chalk.cyan(badges[framework] || framework);
  }

  private shortenPath(filePath: string): string {
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      return filePath.substring(cwd.length + 1);
    }
    return filePath;
  }
}
