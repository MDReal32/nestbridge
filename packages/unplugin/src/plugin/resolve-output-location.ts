import { join, resolve } from 'node:path';
import { findWorkspaceRoot } from '../discovery/find-workspace-root';
import { readPackageName } from '../discovery/read-package-name';

export const DEFAULT_OUTPUT_DIR = '.nestbridge';

interface OutputLocationInput {
  outputDir: string | undefined;
  root: string;
  bundlerRoot: string | undefined;
}

export interface OutputLocation {
  outputDir: string;
  declarationDir: string;
}

const resolveOutputDir = (input: OutputLocationInput) => {
  const projectRoot = input.bundlerRoot ?? input.root;

  if (input.outputDir !== undefined) {
    return resolve(projectRoot, input.outputDir);
  }

  return resolve(findWorkspaceRoot(projectRoot) ?? projectRoot, DEFAULT_OUTPUT_DIR);
};

/**
 * Every server gets one folder, named after the package at its `root`, so any number of clients of
 * that server share the same declarations.
 */
export const resolveOutputLocation = (input: OutputLocationInput): OutputLocation => {
  const outputDir = resolveOutputDir(input);

  return { outputDir, declarationDir: join(outputDir, readPackageName(input.root)) };
};
