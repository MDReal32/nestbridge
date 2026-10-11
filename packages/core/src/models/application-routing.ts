import type { GlobalPrefix } from './global-prefix';
import type { UriVersioning } from './uri-versioning';

export interface ApplicationRouting {
  globalPrefix?: GlobalPrefix;
  versioning?: UriVersioning;
}
