import ts from 'typescript';
import { findDecorator } from './decorator-inspection';

export const findResolverClasses = (sourceFile: ts.SourceFile) => {
  return sourceFile.statements.filter(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && findDecorator(statement, 'Resolver') !== undefined,
  );
};
