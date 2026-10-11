import type { ResolvedNestBridgeOptions } from '../options';

const generateBaseURLStatement = (entry: ResolvedNestBridgeOptions) => {
  if (entry.baseURL === undefined) {
    return undefined;
  }

  if (entry.name === undefined) {
    return `setNestBridgeBaseURL(${JSON.stringify(entry.baseURL)});`;
  }

  return `setNestBridgeServiceBaseURL(${JSON.stringify(entry.name)}, ${JSON.stringify(entry.baseURL)});`;
};

export const generateConfigModule = (entries: readonly ResolvedNestBridgeOptions[]) => {
  const statements = entries
    .map(generateBaseURLStatement)
    .filter((statement) => statement !== undefined);

  if (statements.length === 0) {
    return '';
  }

  const importedNames = ['setNestBridgeBaseURL', 'setNestBridgeServiceBaseURL'].filter((name) =>
    statements.some((statement) => statement.startsWith(`${name}(`)),
  );

  return [`import { ${importedNames.join(', ')} } from 'nestbridge';`, '', ...statements, ''].join(
    '\n',
  );
};
