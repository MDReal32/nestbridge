import { getNestBridgeConfig } from './configure-nestbridge';
import { getNestBridgeBaseURL } from './nestbridge-base-url';
import { getNestBridgeServiceBaseURL } from './nestbridge-service-base-url';

export const resolveBaseURL = (service: string | undefined): string | undefined => {
  if (service === undefined) {
    return getNestBridgeBaseURL();
  }

  return (
    getNestBridgeConfig().services?.[service] ??
    getNestBridgeServiceBaseURL(service) ??
    getNestBridgeBaseURL()
  );
};
