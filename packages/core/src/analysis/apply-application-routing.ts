import type { ApplicationRouting } from '../models/application-routing';
import type { ControllerDefinition } from '../models/controller-definition';
import type { ControllerMethodDefinition } from '../models/controller-method-definition';
import type { GlobalPrefix } from '../models/global-prefix';
import type { GlobalPrefixExclusion } from '../models/global-prefix-exclusion';
import type { UriVersioning } from '../models/uri-versioning';

const splitSegments = (path: string) => path.split('/').filter((segment) => segment.length > 0);

const matchesExclusionPath = (pattern: string, path: string) => {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(path);

  for (const [index, patternSegment] of patternSegments.entries()) {
    if (patternSegment.startsWith('*')) {
      return pathSegments.length > index;
    }

    const pathSegment = pathSegments[index];

    if (pathSegment === undefined) {
      return false;
    }

    if (!patternSegment.startsWith(':') && patternSegment !== pathSegment) {
      return false;
    }
  }

  return patternSegments.length === pathSegments.length;
};

const isExcluded = (exclusion: GlobalPrefixExclusion, method: ControllerMethodDefinition) =>
  (exclusion.httpMethod === undefined || exclusion.httpMethod === method.httpMethod) &&
  matchesExclusionPath(exclusion.path, method.path);

const prefixSegmentFor = (
  method: ControllerMethodDefinition,
  globalPrefix: GlobalPrefix | undefined,
) => {
  if (globalPrefix === undefined || splitSegments(globalPrefix.prefix).length === 0) {
    return '';
  }

  if (globalPrefix.exclude.some((exclusion) => isExcluded(exclusion, method))) {
    return '';
  }

  return `/${splitSegments(globalPrefix.prefix).join('/')}`;
};

const versionSegmentFor = (
  method: ControllerMethodDefinition,
  versioning: UriVersioning | undefined,
) => {
  if (versioning === undefined || method.version === null) {
    return '';
  }

  const version = method.version ?? versioning.defaultVersion;
  return version === undefined ? '' : `/${versioning.prefix}${version}`;
};

const joinRoutedPath = (...parts: string[]) => `/${splitSegments(parts.join('/')).join('/')}`;

const routeMethod = (method: ControllerMethodDefinition, routing: ApplicationRouting) => ({
  ...method,
  path: joinRoutedPath(
    prefixSegmentFor(method, routing.globalPrefix),
    versionSegmentFor(method, routing.versioning),
    method.path,
  ),
});

export const applyApplicationRouting = (
  controllers: readonly ControllerDefinition[],
  routing: ApplicationRouting,
): ControllerDefinition[] =>
  controllers.map((controller) => ({
    ...controller,
    methods: controller.methods.map((method) => routeMethod(method, routing)),
  }));
