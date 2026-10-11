import { describe, expect, it } from 'vitest';
import { resolveNestBridgeOptions } from '../src/options';

describe('resolveNestBridgeOptions', () => {
  it('resolves a single options object into one entry with defaults', () => {
    const [entry, ...rest] = resolveNestBridgeOptions({ controllers: 'server/**/*.controller.ts' });

    expect(rest).toEqual([]);
    expect(entry).toEqual({
      name: undefined,
      controllers: ['server/**/*.controller.ts'],
      resolvers: [],
      baseURL: undefined,
      bootstrap: undefined,
      globalPrefix: undefined,
      versioning: undefined,
      debug: false,
      outputDir: '.nestbridge',
      root: undefined,
    });
  });

  it('resolves an array into one entry per app', () => {
    const entries = resolveNestBridgeOptions([
      { name: 'identity', controllers: ['identity/**/*.controller.ts'] },
      {
        name: 'store',
        controllers: 'store/**/*.controller.ts',
        resolvers: 'store/**/*.resolver.ts',
      },
    ]);

    expect(entries.map((entry) => entry.name)).toEqual(['identity', 'store']);
    expect(entries[1]?.resolvers).toEqual(['store/**/*.resolver.ts']);
  });

  it('passes the logLevel through and leaves it undefined by default', () => {
    const [quiet] = resolveNestBridgeOptions({ controllers: 'a', logLevel: 'error' });
    const [inherited] = resolveNestBridgeOptions({ controllers: 'a' });

    expect(quiet?.logLevel).toBe('error');
    expect(inherited?.logLevel).toBeUndefined();
  });

  it('rejects an unknown logLevel', () => {
    const untypedOptions = JSON.parse('{ "controllers": "a", "logLevel": "verbose" }');

    expect(() => resolveNestBridgeOptions(untypedOptions)).toThrow('Invalid logLevel "verbose"');
  });

  it('turns a string globalPrefix into a prefix without exclusions', () => {
    const [entry] = resolveNestBridgeOptions({ controllers: 'a', globalPrefix: 'api' });

    expect(entry?.globalPrefix).toEqual({ prefix: 'api', exclude: [] });
  });

  it('normalizes globalPrefix exclusions given as strings', () => {
    const [entry] = resolveNestBridgeOptions({
      controllers: 'a',
      globalPrefix: {
        prefix: 'api',
        exclude: ['health', { path: 'oidc/:uid', httpMethod: 'GET' }],
      },
    });

    expect(entry?.globalPrefix).toEqual({
      prefix: 'api',
      exclude: [{ path: 'health' }, { path: 'oidc/:uid', httpMethod: 'GET' }],
    });
  });

  it('defaults the version prefix to v and keeps false as an explicit opt-out', () => {
    const [withVersioning] = resolveNestBridgeOptions({
      controllers: 'a',
      versioning: { defaultVersion: '1' },
    });
    const [withoutRouting] = resolveNestBridgeOptions({
      controllers: 'a',
      versioning: false,
      globalPrefix: false,
    });

    expect(withVersioning?.versioning).toEqual({ prefix: 'v', defaultVersion: '1' });
    expect(withoutRouting?.versioning).toBe(false);
    expect(withoutRouting?.globalPrefix).toBe(false);
  });

  it('rejects an empty array', () => {
    expect(() => resolveNestBridgeOptions([])).toThrow('Pass at least one app');
  });

  it('requires a name for every app when several are configured', () => {
    expect(() =>
      resolveNestBridgeOptions([{ name: 'identity', controllers: 'a' }, { controllers: 'b' }]),
    ).toThrow('App #2 needs a `name`');
  });

  it('allows a single unnamed app inside an array', () => {
    expect(resolveNestBridgeOptions([{ controllers: 'a' }])).toHaveLength(1);
  });

  it('rejects duplicate names', () => {
    expect(() =>
      resolveNestBridgeOptions([
        { name: 'identity', controllers: 'a' },
        { name: 'identity', controllers: 'b' },
      ]),
    ).toThrow('Duplicate app name "identity"');
  });

  it('rejects names that cannot be a folder and a service key', () => {
    expect(() => resolveNestBridgeOptions({ name: '../store', controllers: 'a' })).toThrow(
      'Invalid app name "../store"',
    );
    expect(() => resolveNestBridgeOptions({ name: '', controllers: 'a' })).toThrow(
      'Invalid app name ""',
    );
  });
});
