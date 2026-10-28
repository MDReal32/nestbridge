import { describe, expect, it } from 'vitest';
import { applyApplicationRouting } from '../src/analysis';
import type { ControllerDefinition, ControllerMethodDefinition } from '../src/models';

const method = (overrides: Partial<ControllerMethodDefinition>): ControllerMethodDefinition => ({
  name: 'list',
  httpMethod: 'GET',
  path: '/users',
  parameters: [],
  serverOnlyParameterIndexes: [],
  responseKind: 'json',
  line: 1,
  column: 1,
  ...overrides,
});

const controller = (...methods: ControllerMethodDefinition[]): ControllerDefinition => ({
  name: 'UsersController',
  path: 'users',
  sourceFile: '/server/users.controller.ts',
  methods,
  messageHandlers: [],
});

const pathsOf = (controllers: readonly ControllerDefinition[]) =>
  controllers.flatMap((candidate) =>
    candidate.methods.map((candidateMethod) => candidateMethod.path),
  );

describe('applyApplicationRouting', () => {
  it('leaves paths untouched without a prefix or versioning', () => {
    const routed = applyApplicationRouting([controller(method({ version: '1' }))], {});

    expect(pathsOf(routed)).toEqual(['/users']);
  });

  it('prefixes every route and normalizes slashes in the prefix', () => {
    const routed = applyApplicationRouting([controller(method({}))], {
      globalPrefix: { prefix: '/api/identity/', exclude: [] },
    });

    expect(pathsOf(routed)).toEqual(['/api/identity/users']);
  });

  it('ignores an empty prefix', () => {
    const routed = applyApplicationRouting([controller(method({}))], {
      globalPrefix: { prefix: '', exclude: [] },
    });

    expect(pathsOf(routed)).toEqual(['/users']);
  });

  it('puts the version between the prefix and the route like Nest does', () => {
    const routed = applyApplicationRouting([controller(method({ version: '1' }))], {
      globalPrefix: { prefix: 'api/identity', exclude: [] },
      versioning: { prefix: 'v' },
    });

    expect(pathsOf(routed)).toEqual(['/api/identity/v1/users']);
  });

  it('does not add a version when versioning is not enabled', () => {
    const routed = applyApplicationRouting([controller(method({ version: '1' }))], {
      globalPrefix: { prefix: 'api', exclude: [] },
    });

    expect(pathsOf(routed)).toEqual(['/api/users']);
  });

  it('applies the default version only to routes that state none', () => {
    const routed = applyApplicationRouting(
      [
        controller(
          method({ name: 'unversioned', path: '/a' }),
          method({ name: 'versioned', path: '/b', version: '2' }),
          method({ name: 'neutral', path: '/c', version: null }),
        ),
      ],
      { versioning: { prefix: 'v', defaultVersion: '1' } },
    );

    expect(pathsOf(routed)).toEqual(['/v1/a', '/v2/b', '/c']);
  });

  it('supports an empty version prefix', () => {
    const routed = applyApplicationRouting([controller(method({ version: '1' }))], {
      versioning: { prefix: '' },
    });

    expect(pathsOf(routed)).toEqual(['/1/users']);
  });

  it('skips the prefix for excluded routes but still versions them', () => {
    const routed = applyApplicationRouting(
      [
        controller(
          method({ name: 'show', path: '/oidc/interaction/:uid', version: '1' }),
          method({ name: 'login', httpMethod: 'POST', path: '/oidc/interaction/:uid/login' }),
          method({ name: 'other', path: '/users' }),
        ),
      ],
      {
        globalPrefix: {
          prefix: 'api/identity',
          exclude: [
            { path: 'oidc/interaction/:uid', httpMethod: 'GET' },
            { path: 'oidc/interaction/:uid/login', httpMethod: 'POST' },
          ],
        },
        versioning: { prefix: 'v' },
      },
    );

    expect(pathsOf(routed)).toEqual([
      '/v1/oidc/interaction/:uid',
      '/oidc/interaction/:uid/login',
      '/api/identity/users',
    ]);
  });

  it('only excludes the listed request method', () => {
    const routed = applyApplicationRouting(
      [
        controller(
          method({ name: 'get', httpMethod: 'GET', path: '/health' }),
          method({ name: 'post', httpMethod: 'POST', path: '/health' }),
        ),
      ],
      { globalPrefix: { prefix: 'api', exclude: [{ path: 'health', httpMethod: 'GET' }] } },
    );

    expect(pathsOf(routed)).toEqual(['/health', '/api/health']);
  });

  it('excludes every method when none is listed and supports wildcards', () => {
    const routed = applyApplicationRouting(
      [
        controller(
          method({ name: 'a', httpMethod: 'POST', path: '/health' }),
          method({ name: 'b', path: '/docs/a/b' }),
          method({ name: 'c', path: '/docs' }),
          method({ name: 'd', path: '/healthy' }),
        ),
      ],
      {
        globalPrefix: {
          prefix: 'api',
          exclude: [{ path: 'health' }, { path: 'docs/*' }],
        },
      },
    );

    expect(pathsOf(routed)).toEqual(['/health', '/docs/a/b', '/api/docs', '/api/healthy']);
  });

  it('keeps the root route reachable at the prefix', () => {
    const routed = applyApplicationRouting([controller(method({ path: '/' }))], {
      globalPrefix: { prefix: 'api', exclude: [] },
      versioning: { prefix: 'v' },
    });

    expect(pathsOf(routed)).toEqual(['/api']);
  });

  it('does not mutate the analyzed definitions', () => {
    const original = controller(method({}));

    applyApplicationRouting([original], { globalPrefix: { prefix: 'api', exclude: [] } });

    expect(original.methods[0]?.path).toBe('/users');
  });
});
