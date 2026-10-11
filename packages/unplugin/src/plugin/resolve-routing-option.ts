import type { BootstrapDetection } from '@nestbridge/core';

export const resolveRoutingOption = <T>(
  explicit: T | false | undefined,
  bootstrapFile: string | undefined,
  detect: (bootstrapFilePath: string) => BootstrapDetection<T>,
): BootstrapDetection<T> => {
  if (explicit === false) {
    return { value: undefined, diagnostics: [] };
  }

  if (explicit !== undefined) {
    return { value: explicit, diagnostics: [] };
  }

  return bootstrapFile === undefined
    ? { value: undefined, diagnostics: [] }
    : detect(bootstrapFile);
};
