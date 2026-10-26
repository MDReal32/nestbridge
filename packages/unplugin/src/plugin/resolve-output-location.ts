import { join, relative, resolve } from 'node:path';
import { findWorkspaceRoot } from '../discovery/find-workspace-root';

export const DEFAULT_OUTPUT_DIR = '.nestbridge';

interface OutputLocationInput {
  outputDir: string | undefined;
  name: string | undefined;
  root: string;
  bundlerRoot: string | undefined;
}

export interface OutputLocation {
  outputDir: string;
  declarationDir: string;
  errorBodyDir: string;
  mirrorRoot: string;
}

const withAppName = (outputDir: string, name: string | undefined) =>
  name === undefined ? outputDir : join(outputDir, name);

export const resolveOutputLocation = (input: OutputLocationInput): OutputLocation => {
  const projectRoot = input.bundlerRoot ?? input.root;

  if (input.outputDir !== undefined) {
    const outputDir = resolve(projectRoot, input.outputDir);
    const declarationDir = withAppName(outputDir, input.name);

    return { outputDir, declarationDir, errorBodyDir: declarationDir, mirrorRoot: input.root };
  }

  const workspaceRoot = findWorkspaceRoot(projectRoot);

  if (workspaceRoot === undefined) {
    const outputDir = resolve(projectRoot, DEFAULT_OUTPUT_DIR);
    const declarationDir = withAppName(outputDir, input.name);

    return { outputDir, declarationDir, errorBodyDir: declarationDir, mirrorRoot: input.root };
  }

  const outputDir = resolve(workspaceRoot, DEFAULT_OUTPUT_DIR);

  return {
    outputDir,
    declarationDir: withAppName(outputDir, input.name),
    errorBodyDir: withAppName(join(outputDir, relative(workspaceRoot, projectRoot)), input.name),
    mirrorRoot: workspaceRoot,
  };
};
