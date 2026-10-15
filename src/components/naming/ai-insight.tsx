import { useEffect, useRef, useState } from "react";
import { requestAiExplanation } from "@/lib/ai/client";
import type { AiExplainRequest, AiExplainResponse } from "@/lib/ai/contracts";

const LOADING_STEPS = ["核对分项差异", "整理字义与音律", "形成候选建议"];

export function AiInsightPanel({ request }: { request: AiExplainRequest }) {
  const [result, setResult] = useState<AiExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const sequence = useRef(0);
  const requestKey = request.candidates.map((candidate) => candidate.full).join("|");

  useEffect(() => {
    sequence.current += 1;
    setResult(null);
    setLoading(false);
    setStage(0);
  }, [requestKey]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(
      () => setStage((current) => (current + 1) % LOADING_STEPS.length),
      950,
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  async function run() {
    const runNumber = ++sequence.current;
    setLoading(true);
    setStage(0);
    const response = await requestAiExplanation(request);
    if (runNumber !== sequence.current) return;
    setResult(response);
    setLoading(false);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-ink/15 bg-ink text-paper-3 shadow-[0_16px_40px_rgba(43,32,23,0.12)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium tracking-[0.18em] text-paper-2">
              深度解读 · 批量比较
            </div>
            <h2 className="mt-2 font-serif text-2xl">把这一批讲明白</h2>
          </div>
          <span className="shrink-0 rounded-full border border-paper-3/20 px-2.5 py-1 text-[11px] text-paper-2">
            不改原始分数
          </span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-2">
          本地规则已经完成八字、五行、音律和字义衡分。这里一次比较前三名，只负责把差异、短板和适用场景说明白。
        </p>

        {!result ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void run()}
            className="mt-5 min-h-12 w-full rounded-md bg-paper-3 px-4 font-medium text-ink transition-opacity disabled:cursor-wait disabled:opacity-80"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3" aria-live="polite">
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="size-1.5 animate-pulse rounded-full bg-cinnabar" />
                  <span className="size-1.5 animate-pulse rounded-full bg-cinnabar [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-cinnabar [animation-delay:300ms]" />
                </span>
                {LOADING_STEPS[stage]}…
              </span>
            ) : (
              "开始深度解读"
            )}
          </button>
        ) : (
          <div className="rise mt-5 space-y-5" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-paper-3 px-2.5 py-1 font-medium text-ink">
                {result.meta.source === "local"
                  ? "本地规则"
                  : result.meta.cached
                    ? "AI解读 · 已缓存"
                    : "AI解读"}
              </span>
              <span className="text-paper-2">评分来自固定规则，解读仅整理依据</span>
            </div>

            <p className="text-sm leading-7 text-paper-3">{result.overview}</p>

            <div className="rounded-lg border border-paper-3/20 bg-paper-3/8 p-4">
              <div className="text-[11px] tracking-[0.16em] text-paper-2">本批建议</div>
              <div className="mt-2 flex items-baseline gap-3">
                <strong className="font-serif text-3xl font-normal text-white">
                  {result.recommendation.name}
                </strong>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-paper-2">
                {result.recommendation.reason}
              </p>
            </div>

            <div className="space-y-3">
              {result.items.map((item, index) => (
                <article
                  key={item.name}
                  className="border-t border-paper-3/15 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs tabular-nums text-paper-2">0{index + 1}</span>
                    <h3 className="font-serif text-xl text-white">{item.name}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-paper-3">{item.verdict}</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-paper-2">
                    {item.strengths.map((line) => (
                      <li key={line}>优势 · {line}</li>
                    ))}
                    {item.cautions.map((line) => (
                      <li key={line}>留意 · {line}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-relaxed text-paper-2">适合：{item.bestFor}</p>
                </article>
              ))}
            </div>

            {result.meta.notice ? (
              <p className="rounded-md border border-paper-3/15 bg-paper-3/5 px-3 py-2 text-xs leading-relaxed text-paper-2">
                {result.meta.notice}
              </p>
            ) : null}
            <p className="text-[11px] leading-relaxed text-paper-2/80">{result.disclaimer}</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => void run()}
              className="min-h-11 w-full rounded-md border border-paper-3/25 text-sm text-paper-3 disabled:opacity-60"
            >
              {loading ? "正在重新整理…" : "重新解读"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
