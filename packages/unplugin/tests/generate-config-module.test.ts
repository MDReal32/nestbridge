import { describe, expect, it } from 'vitest';
import { generateConfigModule } from '../src/codegen';
import type { ResolvedNestBridgeOptions } from '../src/options';

const entry = (overrides: Partial<ResolvedNestBridgeOptions>): ResolvedNestBridgeOptions => ({
  name: undefined,
  controllers: [],
  resolvers: [],
  baseURL: undefined,
  bootstrap: undefined,
  globalPrefix: undefined,
  versioning: undefined,
  debug: false,
  logLevel: undefined,
  outputDir: '.nestbridge',
  root: undefined,
  ...overrides,
});

describe('generateConfigModule', () => {
  it('sets the resolved baseURL of an unnamed app', () => {
    const code = generateConfigModule([entry({ baseURL: 'http://localhost:3500' })]);

    expect(code).toContain("import { setNestBridgeBaseURL } from 'nestbridge';");
    expect(code).toContain('setNestBridgeBaseURL("http://localhost:3500");');
  });

  it('produces an empty module when no baseURL is configured', () => {
    const code = generateConfigModule([entry({})]);

    expect(code).toBe('');
  });

  it('registers the baseURL of a named app as a service origin', () => {
    const code = generateConfigModule([
      entry({ name: 'identity', baseURL: 'https://identity.example.com' }),
    ]);

    expect(code).toContain("import { setNestBridgeServiceBaseURL } from 'nestbridge';");
    expect(code).toContain(
      'setNestBridgeServiceBaseURL("identity", "https://identity.example.com");',
    );
    expect(code).not.toContain('setNestBridgeBaseURL(');
  });

  it('registers every app that has a baseURL and skips the ones without', () => {
    const code = generateConfigModule([
      entry({ name: 'identity', baseURL: 'https://identity.example.com' }),
      entry({ name: 'store', baseURL: 'https://store.example.com' }),
      entry({ name: 'notifications' }),
    ]);

    expect(code).toContain(
      'setNestBridgeServiceBaseURL("identity", "https://identity.example.com");',
    );
    expect(code).toContain('setNestBridgeServiceBaseURL("store", "https://store.example.com");');
    expect(code).not.toContain('notifications');
  });
});
