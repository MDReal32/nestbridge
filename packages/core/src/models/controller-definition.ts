import type { ControllerMethodDefinition } from './controller-method-definition';

export interface ControllerDefinition {
  name: string;
  path: string;
  sourceFile: string;
  methods: ControllerMethodDefinition[];
}
