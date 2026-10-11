import type { NestBridgeDiagnostic } from '@nestbridge/core';

export interface NestBridgeAppAnalysis {
  controllerCount: number;
  resolverCount: number;
  diagnostics: NestBridgeDiagnostic[];
  problems: string[];
}
