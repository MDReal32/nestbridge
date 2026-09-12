import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ControllerDefinition } from './controller-definition';

export interface ControllerAnalysisResult {
  controllers: ControllerDefinition[];
  diagnostics: NestBridgeDiagnostic[];
}
