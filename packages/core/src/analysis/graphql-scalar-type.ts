import type { TypeNode } from 'typescript/unstable/ast';
import {
  isArrayTypeNode,
  isIdentifier,
  isTypeReferenceNode,
  isUnionTypeNode,
  SyntaxKind,
} from 'typescript/unstable/ast';

const PRIMITIVE_SCALAR_TYPES: Record<string, string> = {
  string: 'String',
  number: 'Float',
  boolean: 'Boolean',
};

export interface UnwrappedTypeNode {
  identifierText: string;
  isArray: boolean;
  isNullable: boolean;
}

export const unwrapPromise = (typeNode: TypeNode): TypeNode => {
  if (
    isTypeReferenceNode(typeNode) &&
    isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === 'Promise' &&
    typeNode.typeArguments?.[0] !== undefined
  ) {
    return unwrapPromise(typeNode.typeArguments[0]);
  }

  return typeNode;
};

const unwrapNullable = (typeNode: TypeNode) => {
  if (!isUnionTypeNode(typeNode)) {
    return { inner: typeNode, isNullable: false };
  }

  const nonNullMembers = typeNode.types.filter(
    (member) =>
      member.kind !== SyntaxKind.NullKeyword && member.kind !== SyntaxKind.UndefinedKeyword,
  );
  const [onlyMember] = nonNullMembers;

  if (nonNullMembers.length !== 1 || onlyMember === undefined) {
    return { inner: typeNode, isNullable: nonNullMembers.length !== typeNode.types.length };
  }

  return { inner: onlyMember, isNullable: true };
};

const unwrapArrayElement = (typeNode: TypeNode): TypeNode | undefined => {
  if (isArrayTypeNode(typeNode)) {
    return typeNode.elementType;
  }

  if (
    isTypeReferenceNode(typeNode) &&
    isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === 'Array' &&
    typeNode.typeArguments?.[0] !== undefined
  ) {
    return typeNode.typeArguments[0];
  }

  return undefined;
};

const identifierTextOf = (typeNode: TypeNode): string | undefined => {
  if (isTypeReferenceNode(typeNode) && isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text;
  }

  switch (typeNode.kind) {
    case SyntaxKind.StringKeyword:
      return 'string';
    case SyntaxKind.NumberKeyword:
      return 'number';
    case SyntaxKind.BooleanKeyword:
      return 'boolean';
    default:
      return undefined;
  }
};

export const unwrapTypeNode = (typeNode: TypeNode): UnwrappedTypeNode | undefined => {
  const withoutPromise = unwrapPromise(typeNode);
  const { inner: withoutNullable, isNullable } = unwrapNullable(withoutPromise);
  const arrayElement = unwrapArrayElement(withoutNullable);
  const element = arrayElement === undefined ? withoutNullable : unwrapNullable(arrayElement).inner;
  const identifierText = identifierTextOf(element);

  if (identifierText === undefined) {
    return undefined;
  }

  return { identifierText, isArray: arrayElement !== undefined, isNullable };
};

export const graphqlScalarNameFor = (identifierText: string) =>
  PRIMITIVE_SCALAR_TYPES[identifierText] ?? identifierText;

export const graphqlTypeStringFor = (unwrapped: UnwrappedTypeNode, explicitTypeName?: string) => {
  const baseName = explicitTypeName ?? graphqlScalarNameFor(unwrapped.identifierText);
  const wrapped = unwrapped.isArray ? `[${baseName}!]` : baseName;
  return unwrapped.isNullable ? wrapped : `${wrapped}!`;
};
