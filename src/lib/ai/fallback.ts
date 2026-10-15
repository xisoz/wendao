import type { AiCandidate, AiExplainRequest, AiNarrative } from "./contracts.ts";

const SCORE_PARTS = [
  ["命局或行业适配", "bazi", 30],
  ["音律", "tone", 18],
  ["字义", "meaning", 18],
  ["气质", "style", 12],
  ["数理", "numerology", 12],
  ["易用性", "usability", 10],
] as const;

function rankedParts(candidate: AiCandidate) {
  return SCORE_PARTS.map(([label, key, max]) => ({
    label,
    ratio: candidate.scoreBreakdown[key] / max,
  })).sort((a, b) => b.ratio - a.ratio);
}

function verdict(candidate: AiCandidate) {
  if (candidate.score >= 88) return "整体完成度较高，优势不是只集中在单一项目，适合进入最终候选。";
  if (candidate.score >= 78) return "基础较稳，有清楚的长处，也保留了可辨认的取舍。";
  return "特点鲜明，但项目间差距较大，更适合先确认最看重的方向再决定。";
}

function itemFor(candidate: AiCandidate, request: AiExplainRequest): AiNarrative["items"][number] {
  const ranked = rankedParts(candidate);
  const weakest = ranked.at(-1)!;
  const caution =
    weakest.ratio < 0.67
      ? `${weakest.label}相对保守，建议把它作为复核重点，不用被总分掩盖。`
      : "六项之间没有明显断层，最后还应结合真实称呼、书写和家庭感受复核。";
  const charMeaning = candidate.characters
    .slice(0, 2)
    .map((char) => `${char.char}（${char.gloss}）`)
    .join("、");

  return {
    name: candidate.full,
    verdict: verdict(candidate),
    strengths: [
      `${ranked[0].label}与${ranked[1].label}是这一名的主要优势。`,
      `${charMeaning}，字义方向与“${request.context.style}”较一致。`,
    ],
    cautions: [caution],
    bestFor:
      request.kind === "baby"
        ? `偏好${request.context.style}气质，并重视长期称呼自然度的家庭。`
        : `希望品牌呈现${request.context.style}气质${request.context.industry ? `、用于${request.context.industry}` : ""}的场景。`,
  };
}

export function buildLocalNarrative(request: AiExplainRequest): AiNarrative {
  const sorted = [...request.candidates].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const low = sorted.at(-1)!;
  const spread = top.score - low.score;
  const tiedAtTop = sorted.filter((candidate) => candidate.score === top.score).length > 1;
  const chartNote = request.context.chart
    ? `已按日主${request.context.chart.dayElement}、${request.context.chart.strength}及喜用方向对照`
    : request.kind === "company"
      ? "未使用创办人生辰，主要按行业、字义、音律与识别度对照"
      : "当前资料未形成完整命局，主要按已有项目对照";

  return {
    overview:
      spread === 0
        ? `这一批候选总分相同，不能靠总分强行分出高低。${chartNote}。下面继续从字义、读音和使用场景拆开比较，排序只代表展示顺序。`
        : `这一批候选分数跨度为${spread}分。${chartNote}。总分用于排序，真正的差别应继续看各分项是否符合你的使用场景，而不是只挑最高数字。`,
    recommendation: {
      name: top.full,
      reason: `${top.full}${tiedAtTop ? "在同分候选中暂列建议位" : "暂列建议位"}，综合衡分${top.score}分；${rankedParts(
        top,
      )
        .slice(0, 2)
        .map((part) => part.label)
        .join("、")}表现更完整，同时没有用模型改动原始评分。`,
    },
    items: request.candidates.map((candidate) => itemFor(candidate, request)),
    disclaimer:
      "此解读整理的是传统取名规则与语言使用体验，只作命名参考，不预测命运，也不能替代商标、重名或工商核验。",
  };
}
