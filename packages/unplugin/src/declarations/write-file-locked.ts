import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

export const LOCK_FILE_SUFFIX = '.lock';

const DEFAULT_LOCK_TIMEOUT_MS = 5_000;
const DEFAULT_STALE_LOCK_MS = 10_000;
const LOCK_RETRY_INTERVAL_MS = 10;

export interface WriteFileLockedOptions {
  timeoutMs?: number;
  staleAfterMs?: number;
}

const sleep = (milliseconds: number) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
};

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error;

const isStale = (lockPath: string, staleAfterMs: number) => {
  try {
    return Date.now() - statSync(lockPath).mtimeMs > staleAfterMs;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return true;
    }

    throw error;
  }
};

const acquireLock = (lockPath: string, options: Required<WriteFileLockedOptions>) => {
  const deadline = Date.now() + options.timeoutMs;

  while (true) {
    try {
      const descriptor = openSync(lockPath, 'wx');

      return {
        [Symbol.dispose]: () => {
          closeSync(descriptor);
          rmSync(lockPath, { force: true });
        },
      };
    } catch (error) {
      if (!isErrnoException(error) || error.code !== 'EEXIST') {
        throw error;
      }
    }

    if (isStale(lockPath, options.staleAfterMs)) {
      rmSync(lockPath, { force: true });
      continue;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `[NestBridge] Timed out after ${options.timeoutMs}ms waiting for ${lockPath}. Delete it if no other NestBridge process is running.`,
      );
    }

    sleep(LOCK_RETRY_INTERVAL_MS);
  }
};

const hasContent = (filePath: string, content: string) =>
  existsSync(filePath) && readFileSync(filePath, 'utf-8') === content;

export const lockFile = (filePath: string, options: WriteFileLockedOptions = {}) =>
  acquireLock(`${filePath}${LOCK_FILE_SUFFIX}`, {
    timeoutMs: options.timeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS,
    staleAfterMs: options.staleAfterMs ?? DEFAULT_STALE_LOCK_MS,
  });

/**
 * Swaps the content in through a rename. Callers must hold the file's lock.
 */
export const writeFileAtomically = (filePath: string, content: string) => {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;

  try {
    writeFileSync(temporaryPath, content, 'utf-8');
    renameSync(temporaryPath, filePath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
};

export const writeFileLocked = (
  filePath: string,
  content: string,
  options: WriteFileLockedOptions = {},
) => {
  if (hasContent(filePath, content)) {
    return;
  }

  using _lock = lockFile(filePath, options);

  if (hasContent(filePath, content)) {
    return;
  }

  writeFileAtomically(filePath, content);
};
