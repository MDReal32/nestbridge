import { formatDiagnostic, type NestBridgeDiagnostic } from '@nestbridge/core';
import { createUnplugin, type UnpluginInstance, type UnpluginOptions } from 'unplugin';
import { generateConfigModule, generateControllerModule, generateResolverModule } from '../codegen';
import { writeControllerDeclarations, writeResolverDeclarations } from '../declarations';
import { discoverFiles } from '../discovery';
import { type NestBridgeOptions, resolveNestBridgeOptions } from '../options';
import { CONFIG_VIRTUAL_MODULE_ID, RESOLVED_CONFIG_VIRTUAL_MODULE_ID } from '../virtual-modules';
import { createControllerRegistry } from './controller-registry';
import { normalizePath } from './normalize-path';
import { createResolverRegistry } from './resolver-registry';

const reportDiagnostics = (
  diagnostics: readonly NestBridgeDiagnostic[],
  watchMode: boolean | undefined,
) => {
  for (const diagnostic of diagnostics) {
    const message = formatDiagnostic(diagnostic);

    if (watchMode === false) {
      throw new Error(message);
    }

    console.warn(message);
  }
};

export const nestBridgeUnplugin: UnpluginInstance<NestBridgeOptions, false> = createUnplugin<
  NestBridgeOptions,
  false
>((options, meta) => {
  const resolvedOptions = resolveNestBridgeOptions(options);

  let root = resolvedOptions.root ?? process.cwd();
  let controllerRegistry: ReturnType<typeof createControllerRegistry>;
  let resolverRegistry: ReturnType<typeof createResolverRegistry>;

  const log = (message: string) => {
    if (resolvedOptions.debug) {
      console.log(`[nestbridge] ${message}`);
    }
  };

  const runAnalysis = () => {
    const { controllers, diagnostics: controllerDiagnostics } = controllerRegistry.refresh();
    const { resolvers, diagnostics: resolverDiagnostics } = resolverRegistry.refresh();

    reportDiagnostics([...controllerDiagnostics, ...resolverDiagnostics], meta.watchMode);
    writeControllerDeclarations(controllers, root, resolvedOptions.outputDir);
    writeResolverDeclarations(resolvers, root, resolvedOptions.outputDir);
    log(
      `analyzed ${controllers.length} controller(s), ${resolvers.length} resolver(s), ` +
        `${controllerDiagnostics.length + resolverDiagnostics.length} diagnostic(s)`,
    );
  };

  return {
    name: 'nestbridge',
    enforce: 'pre',

    buildStart() {
      controllerRegistry = createControllerRegistry(resolvedOptions.controllers, root);
      resolverRegistry = createResolverRegistry(resolvedOptions.resolvers, root);
      runAnalysis();
    },

    resolveId(source) {
      if (source === CONFIG_VIRTUAL_MODULE_ID) {
        return RESOLVED_CONFIG_VIRTUAL_MODULE_ID;
      }

      return null;
    },

    load(id) {
      if (id === RESOLVED_CONFIG_VIRTUAL_MODULE_ID) {
        return generateConfigModule(resolvedOptions);
      }

      return null;
    },

    transform(_code, id) {
      const absolutePath = normalizePath(id);

      const controller = controllerRegistry.get(absolutePath);
      if (controller !== undefined) {
        return generateControllerModule(controller);
      }

      const resolver = resolverRegistry.get(absolutePath);
      if (resolver !== undefined) {
        return generateResolverModule(resolver);
      }

      return null;
    },

    watchChange(id) {
      const changedFile = normalizePath(id);
      const wasTracked = controllerRegistry.has(changedFile) || resolverRegistry.has(changedFile);
      const isTrackedNow =
        discoverFiles(resolvedOptions.controllers, root).map(normalizePath).includes(changedFile) ||
        discoverFiles(resolvedOptions.resolvers, root).map(normalizePath).includes(changedFile);

      if (!wasTracked && !isTrackedNow) {
        return;
      }

      runAnalysis();
      log(`nestbridge source changed: ${changedFile}`);
    },

    vite: {
      configResolved(config) {
        if (resolvedOptions.root === undefined) {
          root = config.root;
        }
      },
    },
  } satisfies UnpluginOptions;
});
