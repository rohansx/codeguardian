#!/usr/bin/env node

/**
 * CodeGuardian CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { Analyzer } from './analyzer';
import { ConsoleReporter } from './reporters/console-reporter';
import { JSONReporter } from './reporters/json-reporter';
import { AutoFixer } from './fixer';

const program = new Command();

program
  .name('codeguardian')
  .description('The essential code quality tool for frontend projects')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize CodeGuardian in your project')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🛡️  CodeGuardian Initialization\n'));

    const analyzer = new Analyzer();
    const projectInfo = analyzer.getProjectInfo();

    console.log('Detected project configuration:');
    console.log(`  Framework: ${chalk.cyan(projectInfo.framework)}`);
    console.log(`  Build Tool: ${chalk.cyan(projectInfo.buildTool)}`);
    console.log(`  Package Manager: ${chalk.cyan(projectInfo.packageManager)}`);
    console.log(
      `  Tests: ${projectInfo.hasTests ? chalk.green('✓') : chalk.red('✗')}\n`
    );

    const response = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Create .codeguardianrc.json with these settings?',
      initial: true,
    });

    if (response.proceed) {
      try {
        analyzer.initConfig();
        console.log(chalk.green('\n✓ Configuration file created successfully!'));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray('  1. Run: codeguardian analyze'));
        console.log(chalk.gray('  2. Review the analysis results'));
        console.log(chalk.gray('  3. Run: codeguardian clean --interactive\n'));
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
        }
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('\nInitialization cancelled.\n'));
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze your codebase for unused code and complexity')
  .option('--json', 'Output results as JSON')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const spinner = ora('Analyzing your codebase...').start();

    try {
      const analyzer = new Analyzer();

      // Update config with options
      if (options.verbose) {
        const config = analyzer.getConfig();
        config.verbose = true;
      }

      const result = await analyzer.analyze();
      const projectInfo = analyzer.getProjectInfo();

      spinner.succeed('Analysis complete!');

      // Report results
      if (options.json) {
        const reporter = new JSONReporter();
        reporter.report(result, projectInfo);
      } else {
        const reporter = new ConsoleReporter();
        reporter.report(result, projectInfo);
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red('\nError:'), error);
      process.exit(1);
    }
  });

// Clean command
program
  .command('clean')
  .description('Remove unused code from your project')
  .option('--interactive', 'Interactive cleanup with confirmation')
  .option('--safe', 'Only remove code with high confidence', true)
  .option('--verify-tests', 'Run tests after each change')
  .option('--dry-run', 'Show what would be removed without making changes')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n🧹 CodeGuardian Cleanup\n'));

    const spinner = ora('Analyzing unused code...').start();

    try {
      const analyzer = new Analyzer();
      const result = await analyzer.analyze();

      spinner.succeed('Analysis complete!');

      if (
        result.unusedImports.length === 0 &&
        result.unusedDependencies.length === 0
      ) {
        console.log(chalk.green('\n✓ No unused code found! Your codebase is clean.\n'));
        return;
      }

      console.log(`Found ${chalk.yellow(result.unusedImports.length)} unused imports`);
      console.log(
        `Found ${chalk.yellow(result.unusedDependencies.length)} unused dependencies\n`
      );

      if (options.dryRun) {
        console.log(chalk.yellow('DRY RUN - No changes will be made\n'));
      }

      let shouldProceed = true;

      if (options.interactive) {
        const response = await prompts({
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with cleanup?',
          initial: true,
        });
        shouldProceed = response.proceed;
      }

      if (!shouldProceed) {
        console.log(chalk.yellow('Cleanup cancelled.\n'));
        return;
      }

      if (!options.dryRun) {
        const fixSpinner = ora('Removing unused code...').start();

        const fixer = new AutoFixer({
          safeMode: options.safe,
          requireTests: options.verifyTests,
        });

        const fixResult = await fixer.fix(result);

        if (fixResult.success) {
          fixSpinner.succeed('Cleanup complete!');
          console.log(chalk.green(`\n✓ Successfully cleaned up your codebase!`));
          console.log(`  Files modified: ${chalk.cyan(fixResult.filesModified.length)}`);
          console.log(`  Imports removed: ${chalk.cyan(fixResult.importsRemoved)}`);
          console.log(
            `  Dependencies removed: ${chalk.cyan(fixResult.dependenciesRemoved.length)}\n`
          );
        } else {
          fixSpinner.fail('Cleanup failed');
          console.log(chalk.red('\nErrors encountered:'));
          fixResult.errors.forEach((err) => console.log(chalk.red(`  • ${err}`)));
          console.log();
        }
      } else {
        console.log(chalk.gray('\nDry run complete. Use without --dry-run to apply changes.\n'));
      }
    } catch (error) {
      spinner.fail('Cleanup failed');
      console.error(chalk.red('\nError:'), error);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Display information about your project')
  .action(() => {
    console.log(chalk.bold.cyan('\n📋 Project Information\n'));

    const analyzer = new Analyzer();
    const projectInfo = analyzer.getProjectInfo();

    console.log(`Name: ${chalk.cyan(projectInfo.name)}`);
    console.log(`Version: ${chalk.cyan(projectInfo.version)}`);
    console.log(`Framework: ${chalk.cyan(projectInfo.framework)}`);
    console.log(`Build Tool: ${chalk.cyan(projectInfo.buildTool)}`);
    console.log(`Package Manager: ${chalk.cyan(projectInfo.packageManager)}`);
    console.log(
      `Tests: ${projectInfo.hasTests ? chalk.green('✓') : chalk.red('✗')} ${
        projectInfo.testFramework ? `(${projectInfo.testFramework})` : ''
      }\n`
    );
  });

// Parse arguments
program.parse();
