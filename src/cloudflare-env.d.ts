declare module "cloudflare:workers" {
  export const env: {
    AI?: {
      run(model: string, input: Record<string, unknown>): Promise<unknown>;
    };
    AI_RATE_LIMITER?: {
      limit(input: { key: string }): Promise<{ success: boolean }>;
    };
    AI_PROVIDER?: string;
    AI_MODEL?: string;
    AI_BASE_URL?: string;
    AI_API_KEY?: string;
    AI_DAILY_LIMIT?: string;
    AI_CACHE_TTL_SECONDS?: string;
    AI_TIMEOUT_MS?: string;
  };
}
