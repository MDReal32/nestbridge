import type { NestBridgeApp } from './nestbridge-app';

const describeOwner = (app: NestBridgeApp) =>
  app.options.name === undefined ? 'the app' : `"${app.options.name}"`;

export const findOverlappingFiles = (apps: readonly NestBridgeApp[]) => {
  const ownersByFile = new Map<string, NestBridgeApp[]>();

  for (const app of apps) {
    for (const filePath of app.ownedFiles()) {
      ownersByFile.set(filePath, [...(ownersByFile.get(filePath) ?? []), app]);
    }
  }

  return [...ownersByFile.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(
      ([filePath, owners]) =>
        `${filePath} is matched by several apps (${owners.map(describeOwner).join(', ')}). ` +
        'Narrow their controllers and resolvers globs so each file belongs to one app.',
    );
};
