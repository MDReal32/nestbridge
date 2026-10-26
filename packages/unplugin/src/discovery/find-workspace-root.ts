import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WORKSPACE_MARKER_FILES = ['nx.json', 'pnpm-workspace.yaml', 'turbo.json', 'lerna.json'];

const declaresWorkspaces = (directory: string) => {
  const manifestPath = join(directory, 'package.json');

  if (!existsSync(manifestPath)) {
    return false;
  }

  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  return typeof manifest === 'object' && manifest !== null && 'workspaces' in manifest;
};

const isWorkspaceRoot = (directory: string) =>
  WORKSPACE_MARKER_FILES.some((file) => existsSync(join(directory, file))) ||
  declaresWorkspaces(directory);

export const findWorkspaceRoot = (startDirectory: string) => {
  let directory = startDirectory;

  while (true) {
    if (isWorkspaceRoot(directory)) {
      return directory;
    }

    const parent = dirname(directory);

    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
};
