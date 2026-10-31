import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ControllerDefinition } from './controller-definition';

export interface ControllerAnalysisResult {
  controllers: ControllerDefinition[];
  diagnostics: NestBridgeDiagnostic[];
  /**
   * Source files other than the controllers whose content decided the interceptor analysis:
   * the bootstrap file, the modules scanned for `APP_INTERCEPTOR` providers and the interceptor
   * classes. A change to any of them can change the declared response types.
   */
  interceptorFiles: string[];
}
