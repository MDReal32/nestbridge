import type { Plugin } from 'vite';

const MODULE_MARKER = 'export {};';
const MODULE_EXPORT_STATEMENT = /^export\s+(?:type\s+)?(?:\{|\*)/m;
const SOURCE_MAP_COMMENT = /^\/\/# sourceMappingURL=.*$/m;

const appendModuleMarker = (code: string) => {
  const sourceMapComment = SOURCE_MAP_COMMENT.exec(code);
  const bodyEnd = sourceMapComment === null ? code.length : sourceMapComment.index;
  const body = code.slice(0, bodyEnd).trimEnd();
  const trailer = code.slice(bodyEnd);

  return `${body}\n${MODULE_MARKER}\n${trailer}`;
};

export const declarationModuleMarker = () => {
  const plugin: Plugin = {
    name: 'nestbridge:declaration-module-marker',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.fileName.endsWith('.d.ts')) {
          continue;
        }

        if (MODULE_EXPORT_STATEMENT.test(output.code)) {
          continue;
        }

        output.code = appendModuleMarker(output.code);
      }
    },
  };

  return plugin;
};
