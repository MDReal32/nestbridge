import { type NestBridgePluginOptions, nestBridgeUnplugin } from '@nestbridge/unplugin';
import type { Plugin } from 'vite';

export type {
  GlobalPrefixOption,
  NestBridgeLogLevel,
  NestBridgeOptions,
  NestBridgePluginOptions,
  VersioningOption,
} from '@nestbridge/unplugin';
export const nestBridge: (options: NestBridgePluginOptions) => Plugin = nestBridgeUnplugin.vite;
export { VERSION } from './version';
