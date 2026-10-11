import type { NestBridgeDiagnostic } from '../diagnostics/nestbridge-diagnostic';

export interface BootstrapDetection<T> {
  value: T | undefined;
  diagnostics: NestBridgeDiagnostic[];
}
