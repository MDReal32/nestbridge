import type { NestBridgeConfig } from './nestbridge-config';

let currentConfig: NestBridgeConfig = {};

export const configureNestBridge = (config: NestBridgeConfig): void => {
  currentConfig = config;
};

export const getNestBridgeConfig = (): NestBridgeConfig => currentConfig;
