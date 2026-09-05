export type ParameterSourceKind = 'param' | 'query' | 'body' | 'header';

interface ControllerParameterBase {
  index: number;
  parameterName: string;
}

export type ControllerParameterDefinition =
  | (ControllerParameterBase & { kind: 'param'; name: string })
  | (ControllerParameterBase & { kind: 'query'; name?: string })
  | (ControllerParameterBase & { kind: 'body'; name?: string })
  | (ControllerParameterBase & { kind: 'header'; name: string });
