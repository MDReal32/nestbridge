import { resolve } from 'node:path';
import { analyzeControllers } from '../src/analysis';

export const fixture = (name: string) => resolve(import.meta.dirname, 'fixtures', name);

export const analyzeWithBootstrap = (controllerFixture: string, bootstrapFixture?: string) =>
  analyzeControllers([fixture(controllerFixture)], {
    bootstrapFilePath: bootstrapFixture === undefined ? undefined : fixture(bootstrapFixture),
  });

export const wrapperOf = (result: ReturnType<typeof analyzeWithBootstrap>, methodName: string) => {
  const method = result.controllers
    .flatMap((controller) => controller.methods)
    .find((candidate) => candidate.name === methodName);

  if (method === undefined) {
    throw new Error(`Fixture has no method ${methodName}`);
  }

  return method.responseWrapper;
};
