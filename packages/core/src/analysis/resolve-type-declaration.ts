import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import type { ClassDeclaration, SourceFile } from 'typescript/unstable/ast';
import {
  isClassDeclaration,
  isExportDeclaration,
  isImportDeclaration,
  isNamedExports,
  isNamedImports,
  isStringLiteralLikeNode,
} from 'typescript/unstable/ast';
import { parseSourceFile } from './parse-source-file';

export interface ResolvedTypeDeclaration {
  classDeclaration: ClassDeclaration;
  sourceFile: SourceFile;
  filePath: string;
}

interface ImportSource {
  moduleSpecifierText: string;
  importedName: string;
}

const parsedFilesByPath = new Map<string, SourceFile>();

const parseFile = (filePath: string): SourceFile => {
  const cached = parsedFilesByPath.get(filePath);

  if (cached !== undefined) {
    return cached;
  }

  const sourceFile = parseSourceFile(filePath);
  parsedFilesByPath.set(filePath, sourceFile);
  return sourceFile;
};

const resolveModuleFile = (
  fromFilePath: string,
  moduleSpecifierText: string,
): string | undefined => {
  if (!moduleSpecifierText.startsWith('.')) {
    return undefined;
  }

  const base = resolvePath(dirname(fromFilePath), moduleSpecifierText);
  const candidates = [`${base}.ts`, `${base}.tsx`, resolvePath(base, 'index.ts')];

  return candidates.find((candidate) => existsSync(candidate));
};

const findExportedDeclaration = (
  sourceFile: SourceFile,
  name: string,
): ClassDeclaration | undefined =>
  sourceFile.statements.find(
    (statement): statement is ClassDeclaration =>
      isClassDeclaration(statement) && statement.name?.text === name,
  );

const findImportSource = (sourceFile: SourceFile, localName: string): ImportSource | undefined => {
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteralLikeNode(statement.moduleSpecifier)) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;

    if (namedBindings === undefined || !isNamedImports(namedBindings)) {
      continue;
    }

    const element = namedBindings.elements.find((candidate) => candidate.name.text === localName);

    if (element !== undefined) {
      return {
        moduleSpecifierText: statement.moduleSpecifier.text,
        importedName: element.propertyName?.text ?? element.name.text,
      };
    }
  }

  return undefined;
};

const findReExportSource = (sourceFile: SourceFile, name: string): string | undefined => {
  for (const statement of sourceFile.statements) {
    if (
      !isExportDeclaration(statement) ||
      statement.moduleSpecifier === undefined ||
      !isStringLiteralLikeNode(statement.moduleSpecifier)
    ) {
      continue;
    }

    if (statement.exportClause === undefined) {
      return statement.moduleSpecifier.text;
    }

    if (
      isNamedExports(statement.exportClause) &&
      statement.exportClause.elements.some(
        (element) => (element.propertyName?.text ?? element.name.text) === name,
      )
    ) {
      return statement.moduleSpecifier.text;
    }
  }

  return undefined;
};

export const resolveClassDeclaration = (
  name: string,
  fromSourceFile: SourceFile,
  fromFilePath: string,
  visited: Set<string> = new Set(),
): ResolvedTypeDeclaration | undefined => {
  if (visited.has(fromFilePath)) {
    return undefined;
  }

  visited.add(fromFilePath);

  const direct = findExportedDeclaration(fromSourceFile, name);

  if (direct !== undefined) {
    return { classDeclaration: direct, sourceFile: fromSourceFile, filePath: fromFilePath };
  }

  const importSource = findImportSource(fromSourceFile, name);

  if (importSource !== undefined) {
    const resolvedPath = resolveModuleFile(fromFilePath, importSource.moduleSpecifierText);

    if (resolvedPath !== undefined) {
      const nextSourceFile = parseFile(resolvedPath);
      const result = resolveClassDeclaration(
        importSource.importedName,
        nextSourceFile,
        resolvedPath,
        visited,
      );

      if (result !== undefined) {
        return result;
      }
    }
  }

  const reExportModuleSpecifierText = findReExportSource(fromSourceFile, name);

  if (reExportModuleSpecifierText !== undefined) {
    const resolvedPath = resolveModuleFile(fromFilePath, reExportModuleSpecifierText);

    if (resolvedPath !== undefined) {
      const nextSourceFile = parseFile(resolvedPath);
      return resolveClassDeclaration(name, nextSourceFile, resolvedPath, visited);
    }
  }

  return undefined;
};
