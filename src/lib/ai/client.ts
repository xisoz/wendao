import {
  AiExplainResponseSchema,
  type AiExplainRequest,
  type AiExplainResponse,
} from "./contracts.ts";
import { buildLocalNarrative } from "./fallback.ts";

function localResponse(
  request: AiExplainRequest,
  notice: string,
  startedAt: number,
): AiExplainResponse {
  return {
    ...buildLocalNarrative(request),
    meta: {
      source: "local",
      model: null,
      cached: false,
      requestId: `local-${Date.now()}`,
      latencyMs: Date.now() - startedAt,
      notice,
    },
  };
}

export async function requestAiExplanation(request: AiExplainRequest): Promise<AiExplainResponse> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const parsed = AiExplainResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("INVALID_RESPONSE");
    return parsed.data;
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return localResponse(
      request,
      timedOut
        ? "智能解读等待时间较长，已切换到本地规则。"
        : "当前网络未能连接模型，已用本地规则完成解读。",
      startedAt,
    );
  } finally {
    window.clearTimeout(timer);
  }
}
