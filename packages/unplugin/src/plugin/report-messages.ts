export const reportMessages = (messages: readonly string[], watchMode: boolean | undefined) => {
  for (const message of messages) {
    if (watchMode === false) {
      throw new Error(message);
    }

    console.warn(message);
  }
};
