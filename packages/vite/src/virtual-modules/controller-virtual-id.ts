const VIRTUAL_MODULE_PREFIX = 'virtual:nestbridge/controller/';
const RESOLVED_VIRTUAL_MODULE_PREFIX = `\0${VIRTUAL_MODULE_PREFIX}`;

export const encodeControllerVirtualId = (absoluteControllerPath: string) =>
  `${VIRTUAL_MODULE_PREFIX}${encodeURIComponent(absoluteControllerPath)}`;

export const resolvedControllerVirtualId = (virtualId: string) => `\0${virtualId}`;

export const isResolvedControllerVirtualId = (id: string) =>
  id.startsWith(RESOLVED_VIRTUAL_MODULE_PREFIX);

export const decodeControllerVirtualId = (resolvedId: string) =>
  decodeURIComponent(resolvedId.slice(RESOLVED_VIRTUAL_MODULE_PREFIX.length));
