import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOCK_FILE_SUFFIX, writeFileLocked } from '../src/declarations/write-file-locked';

const workDir = resolve(import.meta.dirname, 'fixtures', '.write-file-locked-output');
const filePath = resolve(workDir, 'users.controller.d.ts');
const lockPath = `${filePath}${LOCK_FILE_SUFFIX}`;

beforeEach(() => {
  mkdirSync(workDir, { recursive: true });
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('writeFileLocked', () => {
  it('writes the content and releases the lock', () => {
    writeFileLocked(filePath, 'declare class A {}');

    expect(readFileSync(filePath, 'utf-8')).toBe('declare class A {}');
    expect(existsSync(lockPath)).toBe(false);
  });

  it('leaves no temporary files behind', () => {
    writeFileLocked(filePath, 'declare class A {}');

    expect(existsSync(`${filePath}.${process.pid}.tmp`)).toBe(false);
  });

  it('does not rewrite a file whose content is unchanged', () => {
    writeFileLocked(filePath, 'declare class A {}');
    const inodeBefore = statSync(filePath).ino;

    writeFileLocked(filePath, 'declare class A {}');

    expect(statSync(filePath).ino).toBe(inodeBefore);
  });

  it('replaces a file whose content changed', () => {
    writeFileLocked(filePath, 'declare class A {}');
    writeFileLocked(filePath, 'declare class B {}');

    expect(readFileSync(filePath, 'utf-8')).toBe('declare class B {}');
  });

  it('breaks a stale lock left behind by a crashed process', () => {
    writeFileSync(lockPath, '');
    const longAgo = new Date(Date.now() - 60_000);
    utimesSync(lockPath, longAgo, longAgo);

    writeFileLocked(filePath, 'declare class A {}');

    expect(readFileSync(filePath, 'utf-8')).toBe('declare class A {}');
    expect(existsSync(lockPath)).toBe(false);
  });

  it('fails with a clear error when a live lock is never released', () => {
    writeFileSync(lockPath, '');

    expect(() => writeFileLocked(filePath, 'declare class A {}', { timeoutMs: 50 })).toThrow(
      /Timed out after 50ms waiting for .*users\.controller\.d\.ts\.lock/,
    );
    expect(existsSync(filePath)).toBe(false);
    expect(existsSync(lockPath)).toBe(true);
  });
});
