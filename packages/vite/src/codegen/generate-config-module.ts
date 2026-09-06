import type { ResolvedNestBridgeOptions } from '../options';

export const generateConfigModule = (options: ResolvedNestBridgeOptions) => {
  if (options.baseURL === undefined) {
    return '';
  }

  return [
    "import { setNestBridgeBaseURL } from 'nestbridge';",
    '',
    `setNestBridgeBaseURL(${JSON.stringify(options.baseURL)});`,
    '',
  ].join('\n');
};
