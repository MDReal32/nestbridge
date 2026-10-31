export interface ControllerAnalysisOptions {
  /**
   * Also collects `@EventPattern()` / `@MessagePattern()` handlers. Off by default, so clients
   * that only call HTTP routes never receive microservice code.
   */
  messagePatterns?: boolean;
  /**
   * The application bootstrap file. Global interceptors registered through
   * `useGlobalInterceptors()` or `APP_INTERCEPTOR` providers of the modules it bootstraps are read
   * from it. Without it, only `@UseInterceptors()` on controllers and routes is analyzed.
   */
  bootstrapFilePath?: string;
}
