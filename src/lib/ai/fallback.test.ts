import assert from "node:assert/strict";
import test from "node:test";
import { AiExplainRequestSchema, AiNarrativeSchema, type AiExplainRequest } from "./contracts.ts";
import { buildLocalNarrative } from "./fallback.ts";

const breakdown = {
  bazi: 22,
  tone: 15,
  meaning: 16,
  style: 9,
  numerology: 8,
  usability: 9,
  total: 79,
};

const request: AiExplainRequest = {
  kind: "baby",
  context: {
    style: "清雅",
    diagnosis: "日主属木，喜水木调和。",
    chart: {
      dayElement: "木",
      strength: "中和",
      usefulElements: ["水"],
      favorableElements: ["木"],
      lackingElements: ["水"],
      hourKnown: true,
    },
  },
  candidates: [
    {
      full: "林知遥",
      pinyin: "lín zhī yáo",
      score: 86,
      scoreBreakdown: { ...breakdown, bazi: 27, total: 86 },
      meaning: "知而致远，清朗从容。",
      reasons: ["补水木"],
      basis: ["音律舒展"],
      characters: [
        { char: "知", element: "火", gloss: "知晓、见识" },
        { char: "遥", element: "火", gloss: "辽远、开阔" },
      ],
    },
    {
      full: "林清禾",
      pinyin: "lín qīng hé",
      score: 82,
      scoreBreakdown: { ...breakdown, total: 82 },
      meaning: "清澈温润，如禾生长。",
      reasons: ["字义温和"],
      basis: ["读音清楚"],
      characters: [
        { char: "清", element: "水", gloss: "清澈、明净" },
        { char: "禾", element: "木", gloss: "禾苗、生长" },
      ],
    },
  ],
};

test("AI explain request accepts only a small structured batch", () => {
  assert.equal(AiExplainRequestSchema.safeParse(request).success, true);
  assert.equal(
    AiExplainRequestSchema.safeParse({
      ...request,
      candidates: [...request.candidates, ...request.candidates],
    }).success,
    false,
  );
});

test("local fallback stays useful without inventing a new score", () => {
  const result = buildLocalNarrative(request);
  assert.equal(AiNarrativeSchema.safeParse(result).success, true);
  assert.equal(result.recommendation.name, "林知遥");
  assert.deepEqual(
    result.items.map((item) => item.name),
    request.candidates.map((candidate) => candidate.full),
  );
  assert.doesNotMatch(JSON.stringify(result), /必然|改命|保证旺财/);
});
