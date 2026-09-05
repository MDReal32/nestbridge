export type NestBridgeDiagnosticCode =
  | 'unsupported-route'
  | 'unsupported-parameter'
  | 'unsupported-argument'
  | 'unsupported-return-type'
  | 'circular-type';

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
