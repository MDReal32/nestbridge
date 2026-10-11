import { formatDiagnostic, type NestBridgeDiagnostic } from '@nestbridge/core';
import type { BundlerLogger } from './bundler-logger';
import { reportMessages } from './report-messages';

export const reportDiagnostics = (
  diagnostics: readonly NestBridgeDiagnostic[],
  watchMode: boolean | undefined,
  logger: Pick<BundlerLogger, 'warn'>,
) => {
  reportMessages(diagnostics.map(formatDiagnostic), watchMode, logger);
};
