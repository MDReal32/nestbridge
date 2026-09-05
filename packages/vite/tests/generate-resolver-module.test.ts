import type { ResolverMethodDefinition } from '@nestbridge/core';
import { describe, expect, it } from 'vitest';
import { generateResolverModule } from '../src/codegen';

const method = (overrides: Partial<ResolverMethodDefinition>): ResolverMethodDefinition => ({
  name: 'findOne',
  operationKind: 'query',
  operationName: 'findOne',
  arguments: [],
  selection: [],
  line: 1,
  column: 1,
  ...overrides,
});

const resolver = (methods: ResolverMethodDefinition[]) => ({
  name: 'UsersResolver',
  sourceFile: '/fake/user.resolver.ts',
  methods,
});

describe('generateResolverModule', () => {
  it('imports graphqlRequest from @nestbridge/runtime and defines a zero-argument constructor', () => {
    const code = generateResolverModule(resolver([]));

    expect(code).toContain("import { graphqlRequest } from '@nestbridge/runtime';");
    expect(code).toContain('export class UsersResolver {');
    expect(code).toContain('constructor() {}');
  });

  it('builds a document with variables and field arguments for a query with args', () => {
    const code = generateResolverModule(
      resolver([
        method({
          arguments: [
            {
              index: 0,
              parameterName: 'id',
              name: 'id',
              graphqlType: 'String!',
            },
          ],
          selection: [{ name: 'id' }, { name: 'name' }],
        }),
      ]),
    );

    expect(code).toContain(
      'document: "query FindOne($id: String!) { findOne(id: $id) { id name } }"',
    );
    expect(code).toContain('variables: { "id": id }');
  });

  it('unwraps the GraphQL response down to the field the method calls', () => {
    const code = generateResolverModule(resolver([method({})]));

    expect(code).toContain('async findOne() {');
    expect(code).toContain('const result = await graphqlRequest({');
    expect(code).toContain('return result.findOne;');
  });

  it('omits the variables property when the method has no arguments', () => {
    const code = generateResolverModule(resolver([method({})]));

    expect(code).not.toContain('variables:');
  });

  it('uses the mutation keyword and the operation name for the field being called', () => {
    const code = generateResolverModule(
      resolver([
        method({
          name: 'create',
          operationKind: 'mutation',
          operationName: 'createUser',
          arguments: [
            {
              index: 0,
              parameterName: 'name',
              name: 'name',
              graphqlType: 'String!',
            },
          ],
          selection: [{ name: 'id' }],
        }),
      ]),
    );

    expect(code).toContain(
      'document: "mutation Create($name: String!) { createUser(name: $name) { id } }"',
    );
    expect(code).toContain('return result.createUser;');
  });

  it('renders nested selection sets', () => {
    const code = generateResolverModule(
      resolver([
        method({
          selection: [{ name: 'id' }, { name: 'profile', children: [{ name: 'bio' }] }],
        }),
      ]),
    );

    expect(code).toContain('document: "query FindOne { findOne { id profile { bio } } }"');
  });

  it('orders generated function parameters by declared index', () => {
    const code = generateResolverModule(
      resolver([
        method({
          name: 'search',
          arguments: [
            {
              index: 1,
              parameterName: 'limit',
              name: 'limit',
              graphqlType: 'Int',
            },
            {
              index: 0,
              parameterName: 'name',
              name: 'name',
              graphqlType: 'String!',
            },
          ],
        }),
      ]),
    );

    expect(code).toContain('search(name, limit)');
  });
});
