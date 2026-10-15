import { createFileRoute } from "@tanstack/react-router";
import {
  AiExplainRequestSchema,
  type AiExplainResponse,
  type AiNarrative,
} from "@/lib/ai/contracts";
import { buildLocalNarrative } from "@/lib/ai/fallback";
import { generateAiNarrative, getProviderIdentity } from "@/lib/ai/provider.server";
import {
  getCachedNarrative,
  narrativeCacheKey,
  putCachedNarrative,
  takeRateLimit,
} from "@/lib/ai/runtime.server";

const MAX_BODY_BYTES = 32_000;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

function responseWithMeta(
  narrative: AiNarrative,
  meta: AiExplainResponse["meta"],
  remaining?: number,
) {
  return Response.json({ ...narrative, meta } satisfies AiExplainResponse, {
    headers: {
      "cache-control": "no-store",
      ...(remaining === undefined ? {} : { "x-wendao-ai-remaining": String(remaining) }),
    },
  });
}

export const Route = createFileRoute("/api/ai/explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const requestId = crypto.randomUUID();
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return jsonError("仅接受本站请求。", 403);
        }
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > MAX_BODY_BYTES) return jsonError("请求内容过大。", 413);
        if (!request.headers.get("content-type")?.includes("application/json")) {
          return jsonError("请求格式不正确。", 415);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return jsonError("无法读取请求内容。", 400);
        }
        const parsed = AiExplainRequestSchema.safeParse(raw);
        if (!parsed.success) return jsonError("候选名资料不完整，请重新生成。", 400);

        const input = parsed.data;
        const fallback = buildLocalNarrative(input);
        const requestHost = new URL(request.url).hostname;
        const isLocalPreview = requestHost === "127.0.0.1" || requestHost === "localhost";
        const identity = isLocalPreview
          ? ({ available: false, provider: "local", model: null } as const)
          : getProviderIdentity();
        const cacheKey = await narrativeCacheKey(input, identity.provider, identity.model);

        if (identity.available) {
          const cached = await getCachedNarrative(cacheKey);
          if (cached) {
            return responseWithMeta(cached.narrative, {
              source: cached.provider,
              model: cached.model,
              cached: true,
              requestId,
              latencyMs: Date.now() - startedAt,
            });
          }
        }

        if (!identity.available) {
          return responseWithMeta(fallback, {
            source: "local",
            model: null,
            cached: false,
            requestId,
            latencyMs: Date.now() - startedAt,
            notice: "模型服务尚未启用，已用本地规则完成解读。",
          });
        }

        const rate = await takeRateLimit(request);
        if (!rate.allowed) {
          return responseWithMeta(
            fallback,
            {
              source: "local",
              model: null,
              cached: false,
              requestId,
              latencyMs: Date.now() - startedAt,
              notice: "今天的智能解读次数已用完，已切换到本地解读，不影响取名结果。",
            },
            0,
          );
        }

        try {
          const result = await generateAiNarrative(input);
          await putCachedNarrative(cacheKey, result);
          const latencyMs = Date.now() - startedAt;
          console.info(
            JSON.stringify({ event: "ai_explain", requestId, source: result.provider, latencyMs }),
          );
          return responseWithMeta(
            result.narrative,
            {
              source: result.provider,
              model: result.model,
              cached: false,
              requestId,
              latencyMs,
            },
            rate.remaining,
          );
        } catch (error) {
          const latencyMs = Date.now() - startedAt;
          console.warn(
            JSON.stringify({
              event: "ai_explain_fallback",
              requestId,
              latencyMs,
              error: error instanceof Error ? error.message : "UNKNOWN",
            }),
          );
          return responseWithMeta(
            fallback,
            {
              source: "local",
              model: null,
              cached: false,
              requestId,
              latencyMs,
              notice: "智能解读暂时不可用，已自动切换到本地规则。",
            },
            rate.remaining,
          );
        }
      },
    },
  },
});
