import { createUnplugin, type UnpluginInstance, type UnpluginOptions } from 'unplugin';
import { generateConfigModule } from '../codegen';
import { type NestBridgePluginOptions, resolveNestBridgeOptions } from '../options';
import { CONFIG_VIRTUAL_MODULE_ID, RESOLVED_CONFIG_VIRTUAL_MODULE_ID } from '../virtual-modules';
import { findOverlappingFiles } from './find-overlapping-files';
import { createNestBridgeApp, type NestBridgeApp } from './nestbridge-app';
import { normalizePath } from './normalize-path';
import { reportDiagnostics } from './report-diagnostics';
import { reportMessages } from './report-messages';

export const nestBridgeUnplugin: UnpluginInstance<NestBridgePluginOptions, false> = createUnplugin<
  NestBridgePluginOptions,
  false
>((options, meta) => {
  const entries = resolveNestBridgeOptions(options);

  let baseRoot = process.cwd();
  let bundlerRoot: string | undefined;
  let apps: NestBridgeApp[] = [];

  const log = (app: NestBridgeApp, message: string) => {
    if (app.options.debug) {
      const prefix = app.options.name === undefined ? '' : `${app.options.name}: `;
      console.log(`[nestbridge] ${prefix}${message}`);
    }
  };

  const analyzeApps = (targets: readonly NestBridgeApp[]) => {
    for (const app of targets) {
      const { controllerCount, resolverCount, diagnostics, problems } = app.analyze();

      reportMessages(
        problems.map((problem) => `[nestbridge] ${problem}`),
        meta.watchMode,
      );
      reportDiagnostics(diagnostics, meta.watchMode);
      log(
        app,
        `analyzed ${controllerCount} controller(s), ${resolverCount} resolver(s), ` +
          `${diagnostics.length} diagnostic(s)`,
      );
    }

    reportMessages(
      findOverlappingFiles(apps).map((problem) => `[nestbridge] ${problem}`),
      meta.watchMode,
    );
  };

  return {
    name: 'nestbridge',
    enforce: 'pre',

    buildStart() {
      apps = entries.map((entry) => createNestBridgeApp(entry, { baseRoot, bundlerRoot }));
      analyzeApps(apps);
    },

    resolveId(source) {
      if (source === CONFIG_VIRTUAL_MODULE_ID) {
        return RESOLVED_CONFIG_VIRTUAL_MODULE_ID;
      }

      return null;
    },

    load(id) {
      if (id === RESOLVED_CONFIG_VIRTUAL_MODULE_ID) {
        return generateConfigModule(entries);
      }

      return null;
    },

    transform(_code, id) {
      const absolutePath = normalizePath(id);

      for (const app of apps) {
        const code = app.transform(absolutePath);

        if (code !== undefined) {
          return code;
        }
      }

      return null;
    },

    watchChange(id) {
      const changedFile = normalizePath(id);
      const affectedApps = apps.filter((app) => app.isAffectedBy(changedFile));

      if (affectedApps.length === 0) {
        return;
      }

      analyzeApps(affectedApps);

      for (const app of affectedApps) {
        log(app, `nestbridge source changed: ${changedFile}`);
      }
    },

    vite: {
      configResolved(config) {
        baseRoot = config.root;
        bundlerRoot = config.root;
      },
    },

    webpack(compiler) {
      bundlerRoot = compiler.options.context ?? bundlerRoot;
    },
  } satisfies UnpluginOptions;
});
