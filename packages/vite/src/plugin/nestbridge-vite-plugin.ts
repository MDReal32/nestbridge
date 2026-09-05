import { formatDiagnostic, type NestBridgeDiagnostic } from '@nestbridge/core';
import { normalizePath, type Plugin, type ResolvedConfig } from 'vite';
import { generateControllerModule, generateResolverModule } from '../codegen';
import { writeControllerDeclarations, writeResolverDeclarations } from '../declarations';
import { discoverFiles } from '../discovery';
import { type NestBridgeOptions, resolveNestBridgeOptions } from '../options';
import {
  decodeControllerVirtualId,
  decodeResolverVirtualId,
  encodeControllerVirtualId,
  encodeResolverVirtualId,
  isResolvedControllerVirtualId,
  isResolvedResolverVirtualId,
  resolvedControllerVirtualId,
  resolvedResolverVirtualId,
} from '../virtual-modules';
import { createControllerRegistry } from './controller-registry';
import { createResolverRegistry } from './resolver-registry';

interface DiagnosticReporter {
  error: (message: string) => never;
  warn: (message: string) => void;
}

export const nestBridge = (options: NestBridgeOptions): Plugin => {
  const resolvedOptions = resolveNestBridgeOptions(options);

  let viteConfig: ResolvedConfig;
  let controllerRegistry: ReturnType<typeof createControllerRegistry>;
  let resolverRegistry: ReturnType<typeof createResolverRegistry>;

  const log = (message: string) => {
    if (resolvedOptions.debug) {
      console.log(`[nestbridge] ${message}`);
    }
  };

  const reportDiagnostics = (
    diagnostics: readonly NestBridgeDiagnostic[],
    reporter: DiagnosticReporter,
  ) => {
    for (const diagnostic of diagnostics) {
      const message = formatDiagnostic(diagnostic);

      if (viteConfig.command === 'build') {
        reporter.error(message);
      } else {
        reporter.warn(message);
      }
    }
  };

  const devReporter: DiagnosticReporter = {
    warn: (message) => console.warn(message),
    error: (message) => {
      throw new Error(message);
    },
  };

  const runAnalysis = (reporter: DiagnosticReporter) => {
    const { controllers, diagnostics: controllerDiagnostics } = controllerRegistry.refresh();
    const { resolvers, diagnostics: resolverDiagnostics } = resolverRegistry.refresh();

    reportDiagnostics([...controllerDiagnostics, ...resolverDiagnostics], reporter);
    writeControllerDeclarations(controllers, viteConfig.root, resolvedOptions.outputDir);
    writeResolverDeclarations(resolvers, viteConfig.root, resolvedOptions.outputDir);
    log(
      `analyzed ${controllers.length} controller(s), ${resolvers.length} resolver(s), ` +
        `${controllerDiagnostics.length + resolverDiagnostics.length} diagnostic(s)`,
    );
  };

  return {
    name: 'nestbridge',
    enforce: 'pre',

    configResolved(config) {
      viteConfig = config;
      controllerRegistry = createControllerRegistry(resolvedOptions.controllers, config.root);
      resolverRegistry = createResolverRegistry(resolvedOptions.resolvers, config.root);
    },

    buildStart() {
      runAnalysis(this);
    },

    async resolveId(source, importer, resolveOptions) {
      if (importer === undefined) {
        return null;
      }

      const resolved = await this.resolve(source, importer, { ...resolveOptions, skipSelf: true });

      if (resolved === null) {
        return null;
      }

      const absolutePath = normalizePath(resolved.id);

      if (controllerRegistry.has(absolutePath)) {
        return resolvedControllerVirtualId(encodeControllerVirtualId(absolutePath));
      }

      if (resolverRegistry.has(absolutePath)) {
        return resolvedResolverVirtualId(encodeResolverVirtualId(absolutePath));
      }

      return null;
    },

    load(id) {
      if (isResolvedControllerVirtualId(id)) {
        const controller = controllerRegistry.get(decodeControllerVirtualId(id));
        return controller === undefined ? null : generateControllerModule(controller);
      }

      if (isResolvedResolverVirtualId(id)) {
        const resolver = resolverRegistry.get(decodeResolverVirtualId(id));
        return resolver === undefined ? null : generateResolverModule(resolver);
      }

      return null;
    },

    handleHotUpdate(ctx) {
      const normalizedFile = normalizePath(ctx.file);
      const matchedBefore =
        controllerRegistry.has(normalizedFile) || resolverRegistry.has(normalizedFile);
      const matchesNow =
        discoverFiles(resolvedOptions.controllers, viteConfig.root).includes(normalizedFile) ||
        discoverFiles(resolvedOptions.resolvers, viteConfig.root).includes(normalizedFile);

      if (!matchedBefore && !matchesNow) {
        return undefined;
      }

      runAnalysis(devReporter);
      log(`nestbridge source changed: ${normalizedFile}`);

      const virtualId = controllerRegistry.has(normalizedFile)
        ? resolvedControllerVirtualId(encodeControllerVirtualId(normalizedFile))
        : resolvedResolverVirtualId(encodeResolverVirtualId(normalizedFile));
      const moduleNode = ctx.server.moduleGraph.getModuleById(virtualId);

      return moduleNode === undefined ? undefined : [moduleNode, ...ctx.modules];
    },
  };
};
