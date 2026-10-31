import type { ObjectLiteralExpression } from 'typescript/unstable/ast';

export interface MapOperation {
  parameterName: string;
  returnExpression: ObjectLiteralExpression;
}
