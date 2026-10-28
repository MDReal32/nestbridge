export interface ControllerAnalysisOptions {
  /**
   * Also collects `@EventPattern()` / `@MessagePattern()` handlers. Off by default, so clients
   * that only call HTTP routes never receive microservice code.
   */
  messagePatterns?: boolean;
}
