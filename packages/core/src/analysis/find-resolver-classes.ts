import type { ClassDeclaration, SourceFile } from 'typescript/unstable/ast';
import { isClassDeclaration } from 'typescript/unstable/ast';
import { findDecorator } from './decorator-inspection';

export const findResolverClasses = (sourceFile: SourceFile) => {
  return sourceFile.statements.filter(
    (statement): statement is ClassDeclaration =>
      isClassDeclaration(statement) && findDecorator(statement, 'Resolver') !== undefined,
  );
};
