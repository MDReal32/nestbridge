import { type NestBridgeOptions, nestBridgeUnplugin } from '@nestbridge/unplugin';
import type { WebpackPluginInstance } from 'webpack';

export type { NestBridgeOptions } from '@nestbridge/unplugin';
export const nestBridge: (options: NestBridgeOptions) => WebpackPluginInstance =
  nestBridgeUnplugin.webpack;
export { VERSION } from './version';
