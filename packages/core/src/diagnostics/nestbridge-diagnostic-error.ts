import { formatDiagnostic } from './format-diagnostic';
import type { NestBridgeDiagnostic } from './nestbridge-diagnostic';

export class NestBridgeDiagnosticError extends Error {
  readonly diagnostic: NestBridgeDiagnostic;

  constructor(diagnostic: NestBridgeDiagnostic) {
    super(formatDiagnostic(diagnostic));
    this.name = 'NestBridgeDiagnosticError';
    this.diagnostic = diagnostic;
  }
}
