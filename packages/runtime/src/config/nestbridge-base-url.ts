let currentBaseURL: string | undefined;

export const setNestBridgeBaseURL = (baseURL: string | undefined): void => {
  currentBaseURL = baseURL;
};

export const getNestBridgeBaseURL = (): string | undefined => currentBaseURL;
