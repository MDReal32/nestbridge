import { formatDiagnostic, type NestBridgeDiagnostic } from '@nestbridge/core';
import { reportMessages } from './report-messages';

export const reportDiagnostics = (
  diagnostics: readonly NestBridgeDiagnostic[],
  watchMode: boolean | undefined,
) => {
  reportMessages(diagnostics.map(formatDiagnostic), watchMode);
};
