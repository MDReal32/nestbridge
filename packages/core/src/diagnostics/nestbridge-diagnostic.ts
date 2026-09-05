export type NestBridgeDiagnosticCode = 'unsupported-route' | 'unsupported-parameter';

export interface NestBridgeDiagnostic {
  code: NestBridgeDiagnosticCode;
  title: string;
  controllerName: string;
  memberName: string;
  detail: string;
  found?: string;
  expected?: string;
  filePath: string;
  line: number;
  column: number;
}
