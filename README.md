# 🛡️ CodeGuardian

> The essential code quality tool that every frontend project should install

CodeGuardian is a comprehensive code quality tool that detects unused code, analyzes complexity, and helps you maintain a clean, efficient codebase. Unlike existing tools that solve pieces of the problem, CodeGuardian provides a holistic approach - finding problems, intelligently prioritizing them, safely fixing them, and preventing code quality degradation.

## ✨ Features

### 🔍 Unified Detection Engine
- **Unused Imports**: Detect all unused imports with high accuracy
- **Unused Dependencies**: Find packages in package.json that aren't used
- **Framework-Aware**: Understands React, Vue, Angular, Svelte, Next.js, and Nuxt
- **Smart Detection**: Handles dynamic imports, lazy loading, and code splitting

### 📊 Intelligent Analysis
- **Complexity Scoring**: Cyclomatic complexity analysis for all files
- **Hotspot Detection**: Identify files that need refactoring attention
- **Bundle Size Estimates**: Calculate potential bundle size reduction
- **Time Estimates**: Estimate cleanup time for prioritization

### 🎯 Developer Experience
- **Zero Configuration**: Auto-detects your framework, build tool, and package manager
- **Beautiful CLI**: Interactive terminal interface with progress indicators
- **Multiple Output Formats**: Console, JSON for CI/CD integration
- **Safe by Default**: High confidence thresholds prevent false positives

### 🔧 Smart Auto-fix
- **Safe Removal**: Only removes code with high confidence scores
- **Dry Run Mode**: Preview changes before applying them
- **Interactive Mode**: Review and confirm each change
- **Test Integration**: Optionally verify tests pass after cleanup

## 🚀 Quick Start

### Installation

```bash
# npm
npm install -g codeguardian

# or use npx (no installation required)
npx codeguardian analyze
```

### Basic Usage

```bash
# Initialize CodeGuardian in your project
codeguardian init

# Analyze your codebase
codeguardian analyze

# Clean up unused code interactively
codeguardian clean --interactive

# Auto-fix with safety checks
codeguardian clean --safe --verify-tests

# Dry run to see what would be changed
codeguardian clean --dry-run
```

## 📖 Commands

### `codeguardian init`
Initialize CodeGuardian in your project. Auto-detects your framework, build tool, and creates a configuration file.

```bash
codeguardian init
```

### `codeguardian analyze`
Analyze your codebase for unused code and complexity issues.

```bash
# Basic analysis
codeguardian analyze

# JSON output for CI/CD
codeguardian analyze --json

# Verbose output
codeguardian analyze --verbose
```

### `codeguardian clean`
Remove unused code from your project.

```bash
# Interactive cleanup (recommended)
codeguardian clean --interactive

# Auto-fix with safety checks
codeguardian clean --safe

# Verify tests after cleanup
codeguardian clean --verify-tests

# Preview changes without applying
codeguardian clean --dry-run
```

### `codeguardian info`
Display information about your project configuration.

```bash
codeguardian info
```

## ⚙️ Configuration

CodeGuardian works with zero configuration, but you can customize behavior by creating a `.codeguardianrc.json` file:

```json
{
  "srcDir": "src",
  "exclude": ["node_modules", "dist", "build"],
  "include": ["**/*.{ts,tsx,js,jsx,vue,svelte}"],
  "analyzeUnusedImports": true,
  "analyzeUnusedDependencies": true,
  "analyzeUnusedExports": true,
  "safeMode": true,
  "autoFix": false,
  "complexityThreshold": 10,
  "confidenceThreshold": 0.8,
  "outputFormat": "text"
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `srcDir` | string | `"src"` | Source directory to analyze |
| `exclude` | string[] | `["node_modules", ...]` | Patterns to exclude |
| `include` | string[] | `["**/*.{ts,tsx,js,jsx}"]` | Patterns to include |
| `analyzeUnusedImports` | boolean | `true` | Detect unused imports |
| `analyzeUnusedDependencies` | boolean | `true` | Detect unused dependencies |
| `safeMode` | boolean | `true` | Only high-confidence removals |
| `autoFix` | boolean | `false` | Automatically fix issues |
| `complexityThreshold` | number | `10` | Complexity hotspot threshold |
| `confidenceThreshold` | number | `0.8` | Minimum confidence for fixes |
| `outputFormat` | string | `"text"` | Output format (text/json) |

## 🎨 Example Output

```
📊 CodeGuardian Analysis Report

Project Information:
  Name: my-awesome-app
  Version: 1.0.0
  Framework: ⚛️  React
  Build Tool: vite
  Package Manager: pnpm
  Tests: ✓ (jest)

────────────────────────────────────────────────────────────

Summary:
  Total Files Analyzed: 127
  Unused Imports: 23
  Unused Dependencies: 5
  Estimated Bundle Size Reduction: 73 KB
  Estimated Cleanup Time: 12 minutes

────────────────────────────────────────────────────────────

⚠️  Unused Imports:

  src/components/Header.tsx:
    Line 3: styles from './Header.module.css'
    Line 5: Button from '@/components/Button'

  src/utils/helpers.ts:
    Line 1: moment from 'moment'

────────────────────────────────────────────────────────────

⚠️  Unused Dependencies:

  Dependencies:
    • lodash (^4.17.21)
      Not imported in any source file

  Dev Dependencies:
    • @types/react-router (^5.1.20)
      Not imported in any source file

────────────────────────────────────────────────────────────

🔥 Complexity Hotspots:

  1. src/components/Dashboard.tsx
     Complexity: 45 | LOC: 523 | Functions: 12

  2. src/utils/dataProcessor.ts
     Complexity: 38 | LOC: 412 | Functions: 8

────────────────────────────────────────────────────────────

💡 Recommendations:

  1. Remove 23 unused imports to reduce bundle size
  2. Remove 5 unused dependencies to speed up installs
  3. Refactor 2 high-complexity files for better maintainability

Next steps:
  Run with --fix to automatically remove unused imports
  Run with --interactive for guided cleanup
```

## 🔌 Programmatic API

You can also use CodeGuardian programmatically in your own tools:

```typescript
import { Analyzer, ConsoleReporter } from 'codeguardian';

const analyzer = new Analyzer('/path/to/project');

// Get project info
const projectInfo = analyzer.getProjectInfo();
console.log(`Framework: ${projectInfo.framework}`);

// Run analysis
const result = await analyzer.analyze();

// Report results
const reporter = new ConsoleReporter();
reporter.report(result, projectInfo);

// Get statistics
console.log(`Found ${result.unusedImports.length} unused imports`);
console.log(`Estimated savings: ${result.estimatedBundleSizeReduction} KB`);
```

## 🏗️ How It Works

### Detection Algorithm

1. **Parse Phase**: Uses Babel to parse JavaScript/TypeScript files into AST
2. **Collection Phase**: Collects all imports, exports, and identifier usage
3. **Analysis Phase**: Cross-references imports with actual usage
4. **Confidence Scoring**: Assigns confidence scores based on detection patterns
5. **Reporting Phase**: Generates actionable reports with recommendations

### Framework Detection

CodeGuardian automatically detects your framework by analyzing:
- `package.json` dependencies
- Project file structure
- Configuration files

Supported frameworks:
- ⚛️ React (CRA, Vite, custom)
- 💚 Vue 2 & 3
- 🅰️ Angular
- 🧡 Svelte
- ▲ Next.js
- 💚 Nuxt

### Safety Features

- **High Confidence Thresholds**: Only removes code we're sure is unused
- **Safe Mode**: Extra conservative by default
- **Test Verification**: Optional test runs after cleanup
- **Dry Run**: Preview changes before applying
- **Special Case Handling**: Knows about React, JSX, namespaces, and more

## 🎯 Use Cases

### For Individual Developers
- Clean up legacy code before refactoring
- Reduce bundle size for performance
- Maintain clean codebase habits
- Learn about code complexity patterns

### For Teams
- Onboard new developers to cleaner codebases
- Enforce code quality standards
- Track technical debt over time
- Prevent unused code from accumulating

### For CI/CD
- Fail builds with too many unused imports
- Generate code quality reports
- Track metrics over time
- Automate cleanup in pre-commit hooks

## 🔮 Roadmap

### v0.2 - Enhanced Detection
- [ ] Unused exports detection
- [ ] Unused files detection
- [ ] CSS class usage detection
- [ ] Component props analysis

### v0.3 - Advanced Features
- [ ] Dependency graph visualization
- [ ] Change frequency analysis
- [ ] Business impact scoring
- [ ] Risk assessment for removal

### v0.4 - Integrations
- [ ] VS Code extension
- [ ] GitHub Action
- [ ] Pre-commit hook
- [ ] Web dashboard

### v0.5 - Team Features
- [ ] Shared configuration
- [ ] Code ownership mapping
- [ ] Cleanup task assignment
- [ ] Progress tracking

## 🤝 Contributing

Contributions are welcome! This is an open-source project aimed at making frontend development better for everyone.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/codeguardian.git
cd codeguardian

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Try it locally
npm link
codeguardian analyze
```

### Areas for Contribution
- Additional framework support
- More detection patterns
- Better fix algorithms
- Documentation improvements
- Bug fixes and edge cases

## 📝 License

MIT © [Your Name]

## 🙏 Acknowledgments

CodeGuardian builds on the excellent work of:
- Babel for parsing
- ESLint for inspiration
- depcheck for dependency analysis patterns
- The open-source community

---

**Made with ❤️ for the frontend community**

Star ⭐ this repository if you find it useful!
