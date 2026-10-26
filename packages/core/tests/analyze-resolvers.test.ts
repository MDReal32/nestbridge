import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeResolvers } from '../src/analysis';

const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

describe('analyzeResolvers', () => {
  it('detects a decorated resolver class', () => {
    const { resolvers, diagnostics } = analyzeResolvers([fixture('widgets.resolver.ts')]);

    expect(diagnostics).toEqual([]);
    expect(resolvers).toHaveLength(1);
    expect(resolvers[0]?.name).toBe('WidgetsResolver');
    expect(resolvers[0]?.sourceFile).toBe(fixture('widgets.resolver.ts'));
  });

  it('ignores class members that are not GraphQL-decorated operations', () => {
    const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
    const methodNames = resolvers[0]?.methods.map((method) => method.name);

    expect(methodNames).not.toContain('helperNotAnEndpoint');
  });

  it.each([
    ['findOne', 'query', 'findOne'],
    ['search', 'query', 'search'],
    ['legacyPing', 'query', 'ping'],
    ['create', 'mutation', 'createUser'],
  ])(
    'maps %s to operationKind %s and operationName %s',
    (methodName, operationKind, operationName) => {
      const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
      const method = resolvers[0]?.methods.find((candidate) => candidate.name === methodName);

      expect(method?.operationKind).toBe(operationKind);
      expect(method?.operationName).toBe(operationName);
    },
  );

  it('extracts a named @Args argument', () => {
    const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.arguments[0]).toMatchObject({
      index: 0,
      parameterName: 'id',
      name: 'id',
      graphqlType: 'String!',
    });
  });

  it('builds a selection set for an @ObjectType return type, including nested object fields', () => {
    const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.selection).toEqual([
      { name: 'id' },
      { name: 'name' },
      { name: 'profile', children: [{ name: 'bio' }] },
    ]);
  });

  it('uses an empty selection set for a primitive scalar return type', () => {
    const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'legacyPing');

    expect(method?.selection).toEqual([]);
  });

  it('records source location for each analyzed method', () => {
    const { resolvers } = analyzeResolvers([fixture('widgets.resolver.ts')]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.line).toBeGreaterThan(0);
    expect(method?.column).toBeGreaterThan(0);
  });

  it('builds a selection set from the @Query() type thunk alone, without a return type annotation', () => {
    const { resolvers, diagnostics } = analyzeResolvers([
      fixture('decorator-return-type.resolver.ts'),
    ]);

    expect(diagnostics).toEqual([]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'findOne');

    expect(method?.selection).toEqual([
      { name: 'id' },
      { name: 'name' },
      { name: 'profile', children: [{ name: 'bio' }] },
    ]);
  });

  it('uses an empty selection set for a scalar type derived from the @Query() type thunk alone', () => {
    const { resolvers, diagnostics } = analyzeResolvers([
      fixture('decorator-return-type.resolver.ts'),
    ]);

    expect(diagnostics).toEqual([]);
    const method = resolvers[0]?.methods.find((candidate) => candidate.name === 'ping');

    expect(method?.selection).toEqual([]);
  });
  describe('nullable unions', () => {
    const analyze = () => analyzeResolvers([fixture('nullable-union.resolver.ts')]);

    it('reports no diagnostics for null, null-first, null-and-undefined and undefined unions', () => {
      expect(analyze().diagnostics).toEqual([]);
    });

    it('maps X | null style arguments to a nullable GraphQL type', () => {
      const method = analyze().resolvers[0]?.methods[0];

      expect(method?.arguments).toMatchObject([
        { name: 'id', graphqlType: 'String!' },
        { name: 'term', graphqlType: 'String' },
        { name: 'prefix', graphqlType: 'String' },
        { name: 'suffix', graphqlType: 'String' },
        { name: 'hint', graphqlType: 'String' },
        { name: 'limit', graphqlType: 'Float' },
        { name: 'offset', graphqlType: 'Float!' },
        { name: 'page', graphqlType: 'Float' },
      ]);
    });

    it('includes nullable model fields in the selection set', () => {
      const method = analyze().resolvers[0]?.methods[0];

      expect(method?.selection).toEqual([
        { name: 'id' },
        { name: 'name' },
        { name: 'nickname' },
        { name: 'note' },
        { name: 'label' },
        { name: 'tags' },
      ]);
    });
  });
});
