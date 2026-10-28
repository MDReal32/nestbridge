/**
 * Who generated an app's declarations, and the options that shape their content. Callers that
 * share an app name and its source share one copy of the declarations, so they must agree on these.
 */
export interface DeclarationClaim {
  /** Absolute, `/`-separated root of the project whose build wrote the declarations. */
  caller: string;
  messagePatterns: boolean;
  /** Absolute, `/`-separated bootstrap file the response wrapper is read from, or `null`. */
  bootstrap: string | null;
}
