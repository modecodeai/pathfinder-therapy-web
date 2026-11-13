interface Env {
  ASSETS: Fetcher;
  ROOM: DurableObjectNamespace;
  ACCOUNTS: DurableObjectNamespace;
  APP_NAME: string;
  /** Cloudflare Secret — never expose to the browser */
  OPENAI_API_KEY?: string;
  /** Cloudflare var — clinical model id; never hard-code in app logic */
  OPENAI_CLINICAL_MODEL?: string;
}
