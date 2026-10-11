import { type NestBridgePluginOptions, nestBridgeUnplugin } from '@nestbridge/unplugin';
import type { WebpackPluginInstance } from 'webpack';

export type {
  GlobalPrefixOption,
  NestBridgeLogLevel,
  NestBridgeOptions,
  NestBridgePluginOptions,
  VersioningOption,
} from '@nestbridge/unplugin';
export const nestBridge: (options: NestBridgePluginOptions) => WebpackPluginInstance =
  nestBridgeUnplugin.webpack;
export { VERSION } from './version';
