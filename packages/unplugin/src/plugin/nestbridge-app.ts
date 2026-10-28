import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  type ApplicationRouting,
  detectErrorResponseShape,
  detectGlobalPrefix,
  detectResponseWrapper,
  detectVersioning,
} from '@nestbridge/core';
import { generateControllerModule, generateResolverModule } from '../codegen';
import {
  claimDeclarations,
  DECLARATION_CLAIM_FILE_NAME,
  type DeclarationClaim,
  mirroredPath,
  writeControllerDeclarations,
  writeErrorBodyDeclaration,
  writeResolverDeclarations,
} from '../declarations';
import { discoverFiles, resolveBootstrapFile } from '../discovery';
import type { ResolvedNestBridgeOptions } from '../options';
import { createControllerRegistry } from './controller-registry';
import { describeDeclarationConflict } from './describe-declaration-conflict';
import type { NestBridgeAppAnalysis } from './nestbridge-app-analysis';
import type { NestBridgeAppLocation } from './nestbridge-app-location';
import { normalizePath } from './normalize-path';
import { resolveOutputLocation } from './resolve-output-location';
import { resolveRoutingOption } from './resolve-routing-option';
import { createResolverRegistry } from './resolver-registry';

export interface NestBridgeApp {
  options: ResolvedNestBridgeOptions;
  analyze: () => NestBridgeAppAnalysis;
  transform: (filePath: string) => string | undefined;
  ownedFiles: () => string[];
  isAffectedBy: (changedFile: string) => boolean;
}

export const createNestBridgeApp = (
  options: ResolvedNestBridgeOptions,
  location: NestBridgeAppLocation,
): NestBridgeApp => {
  const root =
    options.root === undefined ? location.baseRoot : resolve(location.baseRoot, options.root);
  const output = resolveOutputLocation({
    outputDir: options.outputDir,
    name: options.name,
    root,
    bundlerRoot: location.bundlerRoot,
  });
  const controllerRegistry = createControllerRegistry(options.controllers, root, {
    messagePatterns: options.messagePatterns,
  });
  const resolverRegistry = createResolverRegistry(options.resolvers, root);
  const claimPath = mirroredPath(
    output.mirrorRoot,
    output.declarationDir,
    join(root, DECLARATION_CLAIM_FILE_NAME),
  );
  const caller = normalizePath(location.bundlerRoot ?? location.baseRoot);
  let bootstrapFilePath: string | undefined;

  const describeApp = () => (options.name === undefined ? 'the app' : `app "${options.name}"`);

  const locateBootstrapFile = (problems: string[]) => {
    const bootstrapFile = resolveBootstrapFile(root, output.outputDir, options.bootstrap);

    if (
      bootstrapFile !== undefined &&
      options.bootstrap !== undefined &&
      !existsSync(bootstrapFile)
    ) {
      problems.push(`Bootstrap file of ${describeApp()} not found: ${bootstrapFile}`);
      return undefined;
    }

    return bootstrapFile;
  };

  const matchesPatterns = (patterns: readonly string[], filePath: string) =>
    discoverFiles(patterns, root).map(normalizePath).includes(filePath);

  const isBootstrapFile = (filePath: string) => {
    const bootstrapFile = resolveBootstrapFile(root, output.outputDir, options.bootstrap);
    return bootstrapFile !== undefined && normalizePath(bootstrapFile) === filePath;
  };

  const analyze = (): NestBridgeAppAnalysis => {
    const problems: string[] = [];
    const bootstrapFile = locateBootstrapFile(problems);
    bootstrapFilePath = bootstrapFile === undefined ? undefined : normalizePath(bootstrapFile);

    const globalPrefix = resolveRoutingOption(
      options.globalPrefix,
      bootstrapFile,
      detectGlobalPrefix,
    );
    const versioning = resolveRoutingOption(options.versioning, bootstrapFile, detectVersioning);
    const routing: ApplicationRouting = {
      globalPrefix: globalPrefix.value,
      versioning: versioning.value,
    };
    const responseWrapper =
      bootstrapFile === undefined ? undefined : detectResponseWrapper(bootstrapFile);
    const errorResponseShape =
      bootstrapFile === undefined ? undefined : detectErrorResponseShape(bootstrapFile);

    const { controllers, diagnostics: controllerDiagnostics } = controllerRegistry.refresh(routing);
    const { resolvers, diagnostics: resolverDiagnostics } = resolverRegistry.refresh();

    const claim: DeclarationClaim = {
      caller,
      messagePatterns: options.messagePatterns,
      bootstrap: bootstrapFilePath ?? null,
    };
    const owner = claimDeclarations(claimPath, claim);

    if (owner === undefined) {
      writeControllerDeclarations(
        controllers,
        output.mirrorRoot,
        output.declarationDir,
        responseWrapper,
      );
      writeResolverDeclarations(resolvers, output.mirrorRoot, output.declarationDir);
      writeErrorBodyDeclaration(output.errorBodyDir, errorResponseShape);
    } else {
      problems.push(describeDeclarationConflict(options.name, output.declarationDir, owner, claim));
    }

    return {
      controllerCount: controllers.length,
      resolverCount: resolvers.length,
      diagnostics: [
        ...globalPrefix.diagnostics,
        ...versioning.diagnostics,
        ...controllerDiagnostics,
        ...resolverDiagnostics,
      ],
      problems,
    };
  };

  const transform = (filePath: string) => {
    const controller = controllerRegistry.get(filePath);
    if (controller !== undefined) {
      return generateControllerModule(controller, options.name);
    }

    const resolver = resolverRegistry.get(filePath);
    if (resolver !== undefined) {
      return generateResolverModule(resolver, options.name);
    }

    return undefined;
  };

  const ownedFiles = () => [
    ...controllerRegistry.all().map((controller) => normalizePath(controller.sourceFile)),
    ...resolverRegistry.all().map((resolver) => normalizePath(resolver.sourceFile)),
  ];

  const isAffectedBy = (changedFile: string) =>
    controllerRegistry.has(changedFile) ||
    resolverRegistry.has(changedFile) ||
    changedFile === bootstrapFilePath ||
    matchesPatterns(options.controllers, changedFile) ||
    matchesPatterns(options.resolvers, changedFile) ||
    isBootstrapFile(changedFile);

  return { options, analyze, transform, ownedFiles, isAffectedBy };
};
