import { formatDiagnostic, type NestBridgeDiagnostic } from '@nestbridge/core';
import { normalizePath, type Plugin, type ResolvedConfig } from 'vite';
import { generateControllerModule } from '../codegen';
import { writeControllerDeclarations } from '../declarations';
import { discoverControllerFiles } from '../discovery';
import { type NestBridgeOptions, resolveNestBridgeOptions } from '../options';
import {
  decodeControllerVirtualId,
  encodeControllerVirtualId,
  isResolvedControllerVirtualId,
  resolvedControllerVirtualId,
} from '../virtual-modules';
import { createControllerRegistry } from './controller-registry';

interface DiagnosticReporter {
  error: (message: string) => never;
  warn: (message: string) => void;
}

export const nestBridge = (options: NestBridgeOptions): Plugin => {
  const resolvedOptions = resolveNestBridgeOptions(options);

  let viteConfig: ResolvedConfig;
  let registry: ReturnType<typeof createControllerRegistry>;

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
    const { controllers, diagnostics } = registry.refresh();
    reportDiagnostics(diagnostics, reporter);
    writeControllerDeclarations(controllers, viteConfig.root, resolvedOptions.outputDir);
    log(`analyzed ${controllers.length} controller(s), ${diagnostics.length} diagnostic(s)`);
    return controllers;
  };

  return {
    name: 'nestbridge',
    enforce: 'pre',

    configResolved(config) {
      viteConfig = config;
      registry = createControllerRegistry(resolvedOptions.controllers, config.root);
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

      if (!registry.has(absolutePath)) {
        return null;
      }

      return resolvedControllerVirtualId(encodeControllerVirtualId(absolutePath));
    },

    load(id) {
      if (!isResolvedControllerVirtualId(id)) {
        return null;
      }

      const controller = registry.get(decodeControllerVirtualId(id));

      return controller === undefined ? null : generateControllerModule(controller);
    },

    handleHotUpdate(ctx) {
      const normalizedFile = normalizePath(ctx.file);
      const matchedBefore = registry.has(normalizedFile);
      const matchesNow = discoverControllerFiles(
        resolvedOptions.controllers,
        viteConfig.root,
      ).includes(normalizedFile);

      if (!matchedBefore && !matchesNow) {
        return undefined;
      }

      runAnalysis(devReporter);
      log(`controller changed: ${normalizedFile}`);

      const virtualId = resolvedControllerVirtualId(encodeControllerVirtualId(normalizedFile));
      const moduleNode = ctx.server.moduleGraph.getModuleById(virtualId);

      return moduleNode === undefined ? undefined : [moduleNode, ...ctx.modules];
    },
  };
};
