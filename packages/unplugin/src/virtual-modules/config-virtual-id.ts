/**
 * Must not contain a colon: webpack treats any `letter+:` prefix as a URL
 * scheme and routes the request past its filesystem resolver entirely,
 * bypassing the resolveId hook this virtual module relies on.
 */
export const CONFIG_VIRTUAL_MODULE_ID = 'virtual-nestbridge-config';

export const RESOLVED_CONFIG_VIRTUAL_MODULE_ID = `\0${CONFIG_VIRTUAL_MODULE_ID}`;
