/**
 * `wrappedResultTypeSource` refers to the awaited server result as `Awaited<Result>`. A source
 * without that reference, such as `unknown`, does not depend on the server result at all.
 */
export interface ResponseWrapperDetection {
  wrappedResultTypeSource: string;
}
