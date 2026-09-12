import type { NestBridgeDiagnostic } from '../diagnostics';
import type { ResolverDefinition } from './resolver-definition';

export interface ResolverAnalysisResult {
  resolvers: ResolverDefinition[];
  diagnostics: NestBridgeDiagnostic[];
}
