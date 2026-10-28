import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claimDeclarations } from '../src/declarations/claim-declarations';
import type { DeclarationClaim } from '../src/declarations/declaration-claim';

let workspace: string;
let claimPath: string;
let web: DeclarationClaim;
let posts: DeclarationClaim;

const readClaim = () => JSON.parse(readFileSync(claimPath, 'utf-8'));

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'nestbridge-claim-'));
  claimPath = join(workspace, '.nestbridge/users/apps/users/nestbridge-app.json');

  const webRoot = join(workspace, 'apps/web');
  const postsRoot = join(workspace, 'apps/posts');
  mkdirSync(webRoot, { recursive: true });
  mkdirSync(postsRoot, { recursive: true });

  web = { caller: webRoot, messagePatterns: false, bootstrap: null };
  posts = { caller: postsRoot, messagePatterns: true, bootstrap: null };
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

describe('claimDeclarations', () => {
  it('records the first caller as the owner', () => {
    expect(claimDeclarations(claimPath, web)).toBeUndefined();
    expect(readClaim()).toEqual(web);
  });

  it('lets the owner change its own options', () => {
    claimDeclarations(claimPath, web);
    const changed = { ...web, messagePatterns: true };

    expect(claimDeclarations(claimPath, changed)).toBeUndefined();
    expect(readClaim()).toEqual(changed);
  });

  it('shares the declarations with another caller that configures the app the same way', () => {
    claimDeclarations(claimPath, web);

    expect(claimDeclarations(claimPath, { ...posts, messagePatterns: false })).toBeUndefined();
    expect(readClaim()).toEqual(web);
  });

  it('returns the owner when another caller configures the app differently', () => {
    claimDeclarations(claimPath, web);

    expect(claimDeclarations(claimPath, posts)).toEqual(web);
    expect(
      claimDeclarations(claimPath, { ...web, caller: posts.caller, bootstrap: 'main.ts' }),
    ).toEqual(web);
    expect(readClaim()).toEqual(web);
  });

  it('takes over from an owner whose project no longer exists', () => {
    claimDeclarations(claimPath, web);
    rmSync(web.caller, { recursive: true });

    expect(claimDeclarations(claimPath, posts)).toBeUndefined();
    expect(readClaim()).toEqual(posts);
  });

  it('fails on a claim file it did not write', () => {
    mkdirSync(join(claimPath, '..'), { recursive: true });
    writeFileSync(claimPath, '{"owner":"someone"}');

    expect(() => claimDeclarations(claimPath, web)).toThrow(
      /is not a NestBridge declaration claim\. Delete it/,
    );
  });
});
