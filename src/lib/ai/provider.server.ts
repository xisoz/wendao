import { env } from "cloudflare:workers";
import { AiNarrativeSchema, type AiExplainRequest, type AiNarrative } from "./contracts.ts";
import { buildLocalNarrative } from "./fallback.ts";
import { buildExplainMessages } from "./prompt.server.ts";

export type ModelProvider = "cloudflare-workers-ai" | "openai-compatible";

export type ProviderIdentity = {
  available: boolean;
  provider: ModelProvider | "local";
  model: string | null;
};

type ProviderResult = {
  narrative: AiNarrative;
  provider: ModelProvider;
  model: string;
};

function processSetting(name: string) {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

export function readRuntimeSetting(name: keyof typeof env) {
  const workerValue = env[name];
  return typeof workerValue === "string" && workerValue.trim()
    ? workerValue.trim()
    : processSetting(name);
}

function selectedProvider(): ModelProvider {
  return readRuntimeSetting("AI_PROVIDER") === "openai-compatible"
    ? "openai-compatible"
    : "cloudflare-workers-ai";
}

export function getProviderIdentity(): ProviderIdentity {
  const provider = selectedProvider();
  if (provider === "openai-compatible") {
    const key = readRuntimeSetting("AI_API_KEY");
    const baseUrl = readRuntimeSetting("AI_BASE_URL");
    const model = readRuntimeSetting("AI_MODEL") ?? null;
    return { available: Boolean(key && baseUrl && model), provider, model };
  }

  return {
    available: Boolean(env.AI),
    provider,
    model: readRuntimeSetting("AI_MODEL") ?? "@cf/zai-org/glm-4.7-flash",
  };
}

function numberSetting(name: keyof typeof env, fallback: number, min: number, max: number) {
  const value = Number(readRuntimeSetting(name));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export function getAiRuntimeLimits() {
  return {
    dailyLimit: numberSetting("AI_DAILY_LIMIT", 8, 1, 100),
    cacheTtlSeconds: numberSetting("AI_CACHE_TTL_SECONDS", 604_800, 60, 2_592_000),
    timeoutMs: numberSetting("AI_TIMEOUT_MS", 10_000, 2_000, 30_000),
  };
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("MODEL_TIMEOUT")), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function textFromModelResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") throw new Error("MODEL_EMPTY_RESPONSE");
  const record = result as Record<string, unknown>;
  if (typeof record.response === "string") return record.response;
  if (record.response && typeof record.response === "object") {
    return JSON.stringify(record.response);
  }
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0] as Record<string, unknown> | undefined;
  const message = first?.message as Record<string, unknown> | undefined;
  if (typeof message?.content === "string") return message.content;
  throw new Error("MODEL_UNSUPPORTED_RESPONSE");
}

function jsonFromText(text: string): unknown {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error("MODEL_INVALID_JSON");
  }
}

function normalizeNarrative(value: unknown, request: AiExplainRequest): AiNarrative {
  const parsed = AiNarrativeSchema.safeParse(value);
  if (!parsed.success) throw new Error("MODEL_INVALID_SHAPE");

  const fallback = buildLocalNarrative(request);
  const allowed = new Set(request.candidates.map((candidate) => candidate.full));
  const byName = new Map(parsed.data.items.map((item) => [item.name, item]));
  const fallbackByName = new Map(fallback.items.map((item) => [item.name, item]));
  const items = request.candidates.map(
    (candidate) => byName.get(candidate.full) ?? fallbackByName.get(candidate.full)!,
  );
  const recommendation = allowed.has(parsed.data.recommendation.name)
    ? parsed.data.recommendation
    : fallback.recommendation;

  return AiNarrativeSchema.parse({ ...parsed.data, recommendation, items });
}

async function callCloudflare(request: AiExplainRequest, model: string, timeoutMs: number) {
  if (!env.AI) throw new Error("AI_BINDING_NOT_CONFIGURED");
  return withTimeout(
    env.AI.run(model, {
      messages: buildExplainMessages(request),
      max_completion_tokens: 700,
      temperature: 0.28,
      response_format: { type: "json_object" },
      stream: false,
    }),
    timeoutMs,
  );
}

async function callOpenAiCompatible(request: AiExplainRequest, model: string, timeoutMs: number) {
  const baseUrl = readRuntimeSetting("AI_BASE_URL");
  const apiKey = readRuntimeSetting("AI_API_KEY");
  if (!baseUrl || !apiKey) throw new Error("OPENAI_PROVIDER_NOT_CONFIGURED");
  const endpoint = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildExplainMessages(request),
        max_completion_tokens: 700,
        temperature: 0.28,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAiNarrative(request: AiExplainRequest): Promise<ProviderResult> {
  const identity = getProviderIdentity();
  if (!identity.available || identity.provider === "local" || !identity.model) {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }
  const { timeoutMs } = getAiRuntimeLimits();
  const result =
    identity.provider === "openai-compatible"
      ? await callOpenAiCompatible(request, identity.model, timeoutMs)
      : await callCloudflare(request, identity.model, timeoutMs);
  const narrative = normalizeNarrative(jsonFromText(textFromModelResult(result)), request);
  return { narrative, provider: identity.provider, model: identity.model };
}
