export {
  analyzeControllers,
  analyzeResolvers,
  detectErrorResponseShape,
  detectResponseWrapper,
} from './analysis';
export { generateControllerDeclaration, generateErrorBodyDeclaration } from './declarations';
export type { NestBridgeDiagnostic, NestBridgeDiagnosticCode } from './diagnostics';
export { formatDiagnostic, NestBridgeDiagnosticError } from './diagnostics';
export type {
  ControllerAnalysisResult,
  ControllerDefinition,
  ControllerMethodDefinition,
  ControllerParameterDefinition,
  ErrorResponseShapeDetection,
  GraphqlOperationKind,
  HttpMethod,
  ParameterSourceKind,
  ResolverAnalysisResult,
  ResolverArgumentDefinition,
  ResolverDefinition,
  ResolverMethodDefinition,
  ResponseKind,
  ResponseWrapperDetection,
  SelectionField,
} from './models';
export { VERSION } from './version';
