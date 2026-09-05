import type { NestBridgeConfig } from './nestbridge-config';

let currentConfig: NestBridgeConfig = {};

export const configureNestBridge = (config: NestBridgeConfig) => {
  currentConfig = config;
};

export const getNestBridgeConfig = () => currentConfig;
