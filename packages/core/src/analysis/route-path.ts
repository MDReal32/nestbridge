const trimSlashes = (segment: string) => segment.replace(/^\/+/, '').replace(/\/+$/, '');

export const joinRoutePath = (controllerPath: string, methodPath: string | undefined) => {
  const segments = [trimSlashes(controllerPath), trimSlashes(methodPath ?? '')].filter(
    (segment) => segment.length > 0,
  );

  return `/${segments.join('/')}`;
};
