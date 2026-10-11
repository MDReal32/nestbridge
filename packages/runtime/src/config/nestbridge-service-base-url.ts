const registeredServiceBaseURLs = new Map<string, string>();

export const setNestBridgeServiceBaseURL = (service: string, baseURL: string | undefined): void => {
  if (baseURL === undefined) {
    registeredServiceBaseURLs.delete(service);
    return;
  }

  registeredServiceBaseURLs.set(service, baseURL);
};

export const getNestBridgeServiceBaseURL = (service: string): string | undefined =>
  registeredServiceBaseURLs.get(service);
