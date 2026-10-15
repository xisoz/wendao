import { env } from "cloudflare:workers";
import { AiNarrativeSchema, type AiNarrative } from "./contracts.ts";
import { getAiRuntimeLimits } from "./provider.server.ts";

export type CachedNarrative = {
  narrative: AiNarrative;
  provider: "cloudflare-workers-ai" | "openai-compatible";
  model: string;
};

type MemoryCacheEntry = CachedNarrative & { expiresAt: number };
const memoryCache = new Map<string, MemoryCacheEntry>();
const rateBuckets = new Map<string, { day: string; count: number }>();

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function narrativeCacheKey(input: unknown, provider: string, model: string | null) {
  return sha256(JSON.stringify({ version: 1, provider, model, input }));
}

function cloudflareCache(): Cache | null {
  const storage = (
    globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } }
  ).caches;
  return storage?.default ?? null;
}

function cacheRequest(key: string) {
  return new Request(`https://wendao-cache.invalid/ai-explain/${key}`);
}

export async function getCachedNarrative(key: string): Promise<CachedNarrative | null> {
  const memory = memoryCache.get(key);
  if (memory && memory.expiresAt > Date.now()) {
    return { narrative: memory.narrative, provider: memory.provider, model: memory.model };
  }
  if (memory) memoryCache.delete(key);

  const cache = cloudflareCache();
  if (!cache) return null;
  try {
    const response = await cache.match(cacheRequest(key));
    if (!response) return null;
    const raw = (await response.json()) as Partial<CachedNarrative>;
    const narrative = AiNarrativeSchema.safeParse(raw.narrative);
    if (
      !narrative.success ||
      (raw.provider !== "cloudflare-workers-ai" && raw.provider !== "openai-compatible") ||
      typeof raw.model !== "string"
    ) {
      return null;
    }
    return { narrative: narrative.data, provider: raw.provider, model: raw.model };
  } catch {
    return null;
  }
}

export async function putCachedNarrative(key: string, value: CachedNarrative) {
  const { cacheTtlSeconds } = getAiRuntimeLimits();
  memoryCache.set(key, { ...value, expiresAt: Date.now() + cacheTtlSeconds * 1000 });
  if (memoryCache.size > 200) {
    const oldest = memoryCache.keys().next().value as string | undefined;
    if (oldest) memoryCache.delete(oldest);
  }

  const cache = cloudflareCache();
  if (!cache) return;
  try {
    await cache.put(
      cacheRequest(key),
      Response.json(value, {
        headers: { "cache-control": `public, max-age=${cacheTtlSeconds}` },
      }),
    );
  } catch {
    // The in-memory cache still protects repeat calls in this isolate.
  }
}

async function clientKey(request: Request) {
  const forwarded =
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";
  return sha256(`${ip}|${agent}`);
}

export async function takeRateLimit(request: Request) {
  const { dailyLimit } = getAiRuntimeLimits();
  const key = await clientKey(request);
  if (env.AI_RATE_LIMITER) {
    try {
      const burst = await env.AI_RATE_LIMITER.limit({ key });
      if (!burst.success) return { allowed: false, remaining: 0, limit: dailyLimit };
    } catch {
      // Keep the local daily guard active if the platform binding is unavailable.
    }
  }
  const day = new Date().toISOString().slice(0, 10);
  const current = rateBuckets.get(key);
  const count = current?.day === day ? current.count : 0;
  if (count >= dailyLimit) return { allowed: false, remaining: 0, limit: dailyLimit };
  rateBuckets.set(key, { day, count: count + 1 });

  if (rateBuckets.size > 2_000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.day !== day) rateBuckets.delete(bucketKey);
    }
  }
  return { allowed: true, remaining: dailyLimit - count - 1, limit: dailyLimit };
}
