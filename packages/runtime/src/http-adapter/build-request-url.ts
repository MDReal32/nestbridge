const serializeQuery = (query: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
      continue;
    }

    searchParams.append(key, String(value));
  }

  return searchParams.toString();
};

export const buildRequestUrl = (
  baseURL: string | undefined,
  path: string,
  query: Record<string, unknown> | undefined,
) => {
  const url = `${baseURL ?? ''}${path}`;

  if (query === undefined) {
    return url;
  }

  const queryString = serializeQuery(query);

  return queryString.length > 0 ? `${url}?${queryString}` : url;
};
