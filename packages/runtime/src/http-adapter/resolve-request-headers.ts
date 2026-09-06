import type { NestBridgeConfig } from '../config/nestbridge-config';

export const resolveRequestHeaders = async (
  config: NestBridgeConfig,
  requestHeaders: Record<string, string | undefined> | undefined,
  hasBody: boolean,
): Promise<Record<string, string>> => {
  const globalHeaders =
    typeof config.headers === 'function' ? await config.headers() : (config.headers ?? {});
  const merged: Record<string, string> = { ...globalHeaders };

  if (hasBody) {
    merged['content-type'] = 'application/json';
  }

  for (const [key, value] of Object.entries(requestHeaders ?? {})) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
};
