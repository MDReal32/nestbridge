import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import ts from 'typescript';

export interface ResolvedTypeDeclaration {
  classDeclaration: ts.ClassDeclaration;
  sourceFile: ts.SourceFile;
  filePath: string;
}

interface ImportSource {
  moduleSpecifierText: string;
  importedName: string;
}

const parsedFilesByPath = new Map<string, ts.SourceFile>();

const parseFile = (filePath: string): ts.SourceFile => {
  const cached = parsedFilesByPath.get(filePath);

  if (cached !== undefined) {
    return cached;
  }

  const content = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
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
  sourceFile: ts.SourceFile,
  name: string,
): ts.ClassDeclaration | undefined =>
  sourceFile.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && statement.name?.text === name,
  );

const findImportSource = (
  sourceFile: ts.SourceFile,
  localName: string,
): ImportSource | undefined => {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteralLike(statement.moduleSpecifier)) {
      continue;
    }

    const namedBindings = statement.importClause?.namedBindings;

    if (namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
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

const findReExportSource = (sourceFile: ts.SourceFile, name: string): string | undefined => {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.moduleSpecifier === undefined ||
      !ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      continue;
    }

    if (statement.exportClause === undefined) {
      return statement.moduleSpecifier.text;
    }

    if (
      ts.isNamedExports(statement.exportClause) &&
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
  fromSourceFile: ts.SourceFile,
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
