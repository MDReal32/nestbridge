import ts from 'typescript';
import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';
import type { SelectionField } from '../models/selection-field';
import { findDecorator } from './decorator-inspection';
import { unwrapTypeNode } from './graphql-scalar-type';
import { locationOf } from './node-location';
import { resolveClassDeclaration } from './resolve-type-declaration';

const PRIMITIVE_SCALAR_NAMES = new Set(['string', 'number', 'boolean']);

interface SelectionContext {
  resolverName: string;
  methodName: string;
  diagnostics: NestBridgeDiagnostic[];
  visitedTypeNames: Set<string>;
}

export const extractSelectionFields = (
  classDeclaration: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  filePath: string,
  context: SelectionContext,
): SelectionField[] | undefined => {
  const typeName = classDeclaration.name?.text ?? '(anonymous type)';
  const location = locationOf(sourceFile, classDeclaration);

  if (context.visitedTypeNames.has(typeName)) {
    context.diagnostics.push({
      code: 'circular-type',
      title: 'Circular type.',
      controllerName: context.resolverName,
      memberName: context.methodName,
      detail: `Type "${typeName}" references itself, directly or indirectly. NestBridge cannot build a finite GraphQL selection set for it.`,
      filePath,
      line: location.line,
      column: location.column,
    });
    return undefined;
  }

  const nextVisited = new Set(context.visitedTypeNames).add(typeName);

  const properties = classDeclaration.members.filter(
    (member): member is ts.PropertyDeclaration =>
      ts.isPropertyDeclaration(member) && findDecorator(member, 'Field') !== undefined,
  );

  const fields: SelectionField[] = [];

  for (const property of properties) {
    if (!ts.isIdentifier(property.name)) {
      continue;
    }

    const fieldName = property.name.text;
    const fieldLocation = locationOf(sourceFile, property);

    if (property.type === undefined) {
      context.diagnostics.push({
        code: 'unsupported-return-type',
        title: 'Unsupported field type.',
        controllerName: context.resolverName,
        memberName: context.methodName,
        detail: `Field "${fieldName}" on "${typeName}" needs an explicit type annotation.`,
        filePath,
        line: fieldLocation.line,
        column: fieldLocation.column,
      });
      return undefined;
    }

    const unwrapped = unwrapTypeNode(property.type);

    if (unwrapped === undefined) {
      context.diagnostics.push({
        code: 'unsupported-return-type',
        title: 'Unsupported field type.',
        controllerName: context.resolverName,
        memberName: context.methodName,
        detail: `Field "${fieldName}" on "${typeName}" has a type NestBridge cannot statically resolve.`,
        found: property.type.getText(),
        filePath,
        line: fieldLocation.line,
        column: fieldLocation.column,
      });
      return undefined;
    }

    if (PRIMITIVE_SCALAR_NAMES.has(unwrapped.identifierText)) {
      fields.push({ name: fieldName });
      continue;
    }

    const resolved = resolveClassDeclaration(unwrapped.identifierText, sourceFile, filePath);

    if (resolved === undefined) {
      fields.push({ name: fieldName });
      continue;
    }

    if (findDecorator(resolved.classDeclaration, 'ObjectType') === undefined) {
      context.diagnostics.push({
        code: 'unsupported-return-type',
        title: 'Unsupported field type.',
        controllerName: context.resolverName,
        memberName: context.methodName,
        detail: `Field "${fieldName}" on "${typeName}" resolves to class "${unwrapped.identifierText}", which is not decorated with @ObjectType(). NestBridge cannot build a GraphQL selection set for it.`,
        filePath,
        line: fieldLocation.line,
        column: fieldLocation.column,
      });
      return undefined;
    }

    const children = extractSelectionFields(
      resolved.classDeclaration,
      resolved.sourceFile,
      resolved.filePath,
      {
        ...context,
        visitedTypeNames: nextVisited,
      },
    );

    if (children === undefined) {
      return undefined;
    }

    fields.push({ name: fieldName, children });
  }

  return fields;
};
