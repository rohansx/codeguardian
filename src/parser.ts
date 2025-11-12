/**
 * Parser utilities for analyzing JavaScript/TypeScript files
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as fs from 'fs';
import { UnusedImport } from './types';

export interface ImportInfo {
  name: string;
  source: string;
  line: number;
  column: number;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface FileAnalysis {
  imports: ImportInfo[];
  usedIdentifiers: Set<string>;
  exports: Set<string>;
  hasJSX: boolean;
}

export class Parser {
  /**
   * Parse a file and extract import/export information
   */
  parseFile(filePath: string): FileAnalysis | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parseCode(content, filePath);
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse code content
   */
  parseCode(code: string, filePath: string = 'unknown'): FileAnalysis {
    const imports: ImportInfo[] = [];
    const usedIdentifiers = new Set<string>();
    const exports = new Set<string>();
    let hasJSX = false;

    // Determine file type for parser
    const isTSX = filePath.endsWith('.tsx');
    const isTS = filePath.endsWith('.ts') || isTSX;
    const isJSX = filePath.endsWith('.jsx') || isTSX;

    // Parse with appropriate plugins
    const plugins: parser.ParserPlugin[] = ['classProperties', 'decorators-legacy'];

    if (isTS) {
      plugins.push('typescript');
    }

    if (isJSX || isTSX) {
      plugins.push('jsx');
    }

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins,
      });
    } catch (error) {
      // Try again with unambiguous sourceType
      ast = parser.parse(code, {
        sourceType: 'unambiguous',
        plugins,
      });
    }

    // Traverse AST
    traverse(ast, {
      // Collect imports
      ImportDeclaration(path) {
        const source = path.node.source.value;

        path.node.specifiers.forEach((specifier) => {
          let name = '';
          let isDefault = false;
          let isNamespace = false;

          if (t.isImportDefaultSpecifier(specifier)) {
            name = specifier.local.name;
            isDefault = true;
          } else if (t.isImportNamespaceSpecifier(specifier)) {
            name = specifier.local.name;
            isNamespace = true;
          } else if (t.isImportSpecifier(specifier)) {
            name = specifier.local.name;
          }

          if (name) {
            imports.push({
              name,
              source,
              line: specifier.loc?.start.line || 0,
              column: specifier.loc?.start.column || 0,
              isDefault,
              isNamespace,
            });
          }
        });
      },

      // Collect exports
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach((decl) => {
              if (t.isIdentifier(decl.id)) {
                exports.add(decl.id.name);
              }
            });
          } else if (t.isFunctionDeclaration(path.node.declaration)) {
            if (path.node.declaration.id) {
              exports.add(path.node.declaration.id.name);
            }
          }
        }

        path.node.specifiers?.forEach((spec) => {
          if (t.isExportSpecifier(spec)) {
            const exportedName = t.isIdentifier(spec.exported)
              ? spec.exported.name
              : spec.exported.value;
            exports.add(exportedName);
          }
        });
      },

      ExportDefaultDeclaration() {
        exports.add('default');
      },

      // Check for JSX
      JSXElement() {
        hasJSX = true;
      },

      JSXFragment() {
        hasJSX = true;
      },

      // Collect used identifiers
      Identifier(path) {
        // Skip if this is a declaration
        if (
          path.parent.type === 'ImportSpecifier' ||
          path.parent.type === 'ImportDefaultSpecifier' ||
          path.parent.type === 'ImportNamespaceSpecifier'
        ) {
          return;
        }

        // Skip if this is a property key
        if (
          t.isObjectProperty(path.parent) &&
          path.parent.key === path.node &&
          !path.parent.computed
        ) {
          return;
        }

        usedIdentifiers.add(path.node.name);
      },
    });

    return {
      imports,
      usedIdentifiers,
      exports,
      hasJSX,
    };
  }

  /**
   * Find unused imports in a file
   */
  findUnusedImports(filePath: string): UnusedImport[] {
    const analysis = this.parseFile(filePath);
    if (!analysis) {
      return [];
    }

    const unusedImports: UnusedImport[] = [];

    analysis.imports.forEach((imp) => {
      // Check if the import is used
      let isUsed = analysis.usedIdentifiers.has(imp.name);

      // Special case: React in JSX files
      if (imp.name === 'React' && analysis.hasJSX) {
        isUsed = true;
      }

      // Special case: Namespace imports might be used with property access
      if (imp.isNamespace) {
        // Check if any identifier starts with the namespace name
        for (const identifier of analysis.usedIdentifiers) {
          if (identifier.startsWith(imp.name + '.')) {
            isUsed = true;
            break;
          }
        }
      }

      if (!isUsed) {
        unusedImports.push({
          file: filePath,
          line: imp.line,
          column: imp.column,
          importName: imp.name,
          source: imp.source,
          confidence: 0.95, // High confidence for unused imports
        });
      }
    });

    return unusedImports;
  }
}
