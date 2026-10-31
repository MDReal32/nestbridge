import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const missingName = (root: string) =>
  new Error(
    `[NestBridge] ${join(root, 'package.json')} has no "name". NestBridge names a server's ` +
      'declaration folder after its package: point `root` at the server package, or give it a name.',
  );

export const readPackageName = (root: string) => {
  const manifestPath = join(root, 'package.json');

  if (!existsSync(manifestPath)) {
    throw missingName(root);
  }

  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  if (
    typeof manifest !== 'object' ||
    manifest === null ||
    !('name' in manifest) ||
    typeof manifest.name !== 'string' ||
    manifest.name === ''
  ) {
    throw missingName(root);
  }

  return manifest.name;
};
