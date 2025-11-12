# Contributing to CodeGuardian

Thank you for your interest in contributing to CodeGuardian! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js >= 14.0.0
- npm, yarn, or pnpm
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/codeguardian.git
   cd codeguardian
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Make your changes and test them:
   ```bash
   npm run build
   npm test
   ```

6. Test locally:
   ```bash
   npm link
   cd /path/to/test-project
   codeguardian analyze
   ```

## Project Structure

```
codeguardian/
├── src/
│   ├── analyzers/       # Complexity and other analyzers
│   ├── detectors/       # Detection engines (imports, deps, etc.)
│   ├── reporters/       # Output formatters
│   ├── analyzer.ts      # Main analyzer coordinator
│   ├── cli.ts          # CLI interface
│   ├── config.ts       # Configuration management
│   ├── fixer.ts        # Auto-fix functionality
│   ├── parser.ts       # AST parser utilities
│   ├── types.ts        # TypeScript type definitions
│   └── index.ts        # Public API exports
├── dist/               # Compiled output
└── __tests__/          # Test files
```

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, framework)
- Code samples if applicable

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- Clear description of the feature
- Use case and motivation
- Example usage if applicable
- Any implementation ideas

### Pull Requests

1. **Small PRs are better**: Focus on one feature or fix per PR
2. **Write tests**: Add tests for new functionality
3. **Update docs**: Update README if you change public APIs
4. **Follow code style**: Run `npm run lint` before committing
5. **Write clear commit messages**: Use conventional commits format

#### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(detector): add unused exports detection
fix(parser): handle dynamic imports correctly
docs(readme): update installation instructions
```

## Development Guidelines

### Code Style

- Use TypeScript for all source code
- Follow existing code style (enforced by ESLint)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write unit tests for new functionality
- Test edge cases and error conditions
- Aim for >70% code coverage
- Run tests before submitting PR: `npm test`

### Adding a New Detector

1. Create a new file in `src/detectors/`
2. Implement the detector class with a `detect()` method
3. Add types to `src/types.ts` if needed
4. Integrate into `src/analyzer.ts`
5. Add tests
6. Update documentation

Example:
```typescript
// src/detectors/unused-exports.ts
import { UnusedExport, CodeGuardianConfig } from '../types';

export class UnusedExportsDetector {
  constructor(private config: CodeGuardianConfig) {}

  async detect(projectRoot: string): Promise<UnusedExport[]> {
    // Implementation
    return [];
  }
}
```

### Adding a New Framework

1. Add framework type to `src/types.ts`
2. Update framework detection in `src/config.ts`
3. Add framework-specific parsing logic if needed
4. Test with real projects using that framework
5. Update README with framework support

### Adding a New Reporter

1. Create a new file in `src/reporters/`
2. Implement the reporter class with a `report()` method
3. Add to CLI options in `src/cli.ts`
4. Update documentation

## Testing Strategy

### Unit Tests
Test individual components in isolation:
- Parser functionality
- Detection algorithms
- Configuration management

### Integration Tests
Test components working together:
- Full analysis pipeline
- CLI commands
- Auto-fix operations

### Real-world Testing
Test with actual projects:
- React apps (CRA, Vite, Next.js)
- Vue apps (Vue CLI, Nuxt)
- Angular apps
- Monorepos
- TypeScript/JavaScript codebases

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Publish to npm

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- [ ] Unused exports detection
- [ ] Unused files detection
- [ ] More framework support (Solid.js, Qwik, etc.)
- [ ] Better error messages
- [ ] More test coverage

### Medium Priority
- [ ] CSS/SCSS unused class detection
- [ ] Component props analysis
- [ ] Dependency graph visualization
- [ ] Performance optimizations
- [ ] VS Code extension

### Nice to Have
- [ ] Web dashboard
- [ ] GitHub Action
- [ ] Pre-commit hook integration
- [ ] Change frequency analysis
- [ ] Risk assessment scoring

## Code Review Process

1. Submit PR with clear description
2. Automated checks run (tests, lint, build)
3. Maintainer reviews code
4. Address feedback if any
5. Maintainer merges when approved

## Community Guidelines

- Be respectful and inclusive
- Help others learn
- Give constructive feedback
- Follow the code of conduct
- Have fun and build something great!

## Questions?

- Open a GitHub issue
- Start a discussion
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making CodeGuardian better! 🎉
