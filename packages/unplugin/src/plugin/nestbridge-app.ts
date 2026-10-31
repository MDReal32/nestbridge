import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type ApplicationRouting,
  detectErrorResponseShape,
  detectGlobalPrefix,
  detectVersioning,
} from '@nestbridge/core';
import { generateControllerModule, generateResolverModule } from '../codegen';
import {
  writeControllerDeclarations,
  writeErrorBodyDeclaration,
  writeResolverDeclarations,
} from '../declarations';
import { discoverFiles, resolveBootstrapFile } from '../discovery';
import type { ResolvedNestBridgeOptions } from '../options';
import { createControllerRegistry } from './controller-registry';
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
  supportFiles: () => string[];
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
    root,
    bundlerRoot: location.bundlerRoot,
  });
  const controllerRegistry = createControllerRegistry(options.controllers, root, {
    messagePatterns: true,
  });
  const resolverRegistry = createResolverRegistry(options.resolvers, root);
  let bootstrapFilePath: string | undefined;
  let interceptorFiles: ReadonlySet<string> = new Set();

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
    const errorResponseShape =
      bootstrapFile === undefined ? undefined : detectErrorResponseShape(bootstrapFile);

    const {
      controllers,
      diagnostics: controllerDiagnostics,
      interceptorFiles: analyzedInterceptorFiles,
    } = controllerRegistry.refresh(routing, bootstrapFile);
    interceptorFiles = new Set(analyzedInterceptorFiles.map(normalizePath));
    const { resolvers, diagnostics: resolverDiagnostics } = resolverRegistry.refresh();
    const reportedControllerDiagnostics = options.messagePatterns
      ? controllerDiagnostics
      : controllerDiagnostics.filter(({ code }) => code !== 'unsupported-message-pattern');

    writeControllerDeclarations(controllers, root, output.declarationDir);
    writeResolverDeclarations(resolvers, root, output.declarationDir);
    writeErrorBodyDeclaration(output.declarationDir, errorResponseShape);

    return {
      controllerCount: controllers.length,
      resolverCount: resolvers.length,
      diagnostics: [
        ...globalPrefix.diagnostics,
        ...versioning.diagnostics,
        ...reportedControllerDiagnostics,
        ...resolverDiagnostics,
      ],
      problems,
    };
  };

  const transform = (filePath: string) => {
    const controller = controllerRegistry.get(filePath);
    if (controller !== undefined) {
      return generateControllerModule(
        options.messagePatterns ? controller : { ...controller, messageHandlers: [] },
        options.name,
      );
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

  const supportFiles = () => [
    ...(bootstrapFilePath === undefined ? [] : [bootstrapFilePath]),
    ...interceptorFiles,
  ];

  const isAffectedBy = (changedFile: string) =>
    controllerRegistry.has(changedFile) ||
    resolverRegistry.has(changedFile) ||
    changedFile === bootstrapFilePath ||
    interceptorFiles.has(changedFile) ||
    matchesPatterns(options.controllers, changedFile) ||
    matchesPatterns(options.resolvers, changedFile) ||
    isBootstrapFile(changedFile);

  return { options, analyze, transform, ownedFiles, supportFiles, isAffectedBy };
};
