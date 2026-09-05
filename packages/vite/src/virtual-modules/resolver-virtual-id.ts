const VIRTUAL_MODULE_PREFIX = 'virtual:nestbridge/resolver/';
const RESOLVED_VIRTUAL_MODULE_PREFIX = `\0${VIRTUAL_MODULE_PREFIX}`;

export const encodeResolverVirtualId = (absoluteResolverPath: string) =>
  `${VIRTUAL_MODULE_PREFIX}${encodeURIComponent(absoluteResolverPath)}`;

export const resolvedResolverVirtualId = (virtualId: string) => `\0${virtualId}`;

export const isResolvedResolverVirtualId = (id: string) =>
  id.startsWith(RESOLVED_VIRTUAL_MODULE_PREFIX);

export const decodeResolverVirtualId = (resolvedId: string) =>
  decodeURIComponent(resolvedId.slice(RESOLVED_VIRTUAL_MODULE_PREFIX.length));
