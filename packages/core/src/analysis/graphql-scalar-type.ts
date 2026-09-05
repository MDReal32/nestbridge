import ts from 'typescript';

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

const unwrapPromise = (typeNode: ts.TypeNode): ts.TypeNode => {
  if (
    ts.isTypeReferenceNode(typeNode) &&
    ts.isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === 'Promise' &&
    typeNode.typeArguments?.[0] !== undefined
  ) {
    return unwrapPromise(typeNode.typeArguments[0]);
  }

  return typeNode;
};

const unwrapNullable = (typeNode: ts.TypeNode) => {
  if (!ts.isUnionTypeNode(typeNode)) {
    return { inner: typeNode, isNullable: false };
  }

  const nonNullMembers = typeNode.types.filter(
    (member) =>
      member.kind !== ts.SyntaxKind.NullKeyword && member.kind !== ts.SyntaxKind.UndefinedKeyword,
  );
  const [onlyMember] = nonNullMembers;

  if (nonNullMembers.length !== 1 || onlyMember === undefined) {
    return { inner: typeNode, isNullable: nonNullMembers.length !== typeNode.types.length };
  }

  return { inner: onlyMember, isNullable: true };
};

const unwrapArrayElement = (typeNode: ts.TypeNode): ts.TypeNode | undefined => {
  if (ts.isArrayTypeNode(typeNode)) {
    return typeNode.elementType;
  }

  if (
    ts.isTypeReferenceNode(typeNode) &&
    ts.isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === 'Array' &&
    typeNode.typeArguments?.[0] !== undefined
  ) {
    return typeNode.typeArguments[0];
  }

  return undefined;
};

const identifierTextOf = (typeNode: ts.TypeNode): string | undefined => {
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.text;
  }

  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    default:
      return undefined;
  }
};

export const unwrapTypeNode = (typeNode: ts.TypeNode): UnwrappedTypeNode | undefined => {
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
