import { describe, expect, it } from 'vitest';
import { generateConfigModule } from '../src/codegen';
import type { ResolvedNestBridgeOptions } from '../src/options';

const options = (overrides: Partial<ResolvedNestBridgeOptions>): ResolvedNestBridgeOptions => ({
  controllers: [],
  resolvers: [],
  baseURL: undefined,
  debug: false,
  outputDir: '.nestbridge',
  ...overrides,
});

describe('generateConfigModule', () => {
  it('sets the resolved baseURL', () => {
    const code = generateConfigModule(options({ baseURL: 'http://localhost:3500' }));

    expect(code).toContain("import { setNestBridgeBaseURL } from 'nestbridge';");
    expect(code).toContain('setNestBridgeBaseURL("http://localhost:3500");');
  });

  it('produces an empty module when no baseURL is configured', () => {
    const code = generateConfigModule(options({}));

    expect(code).toBe('');
  });
});
