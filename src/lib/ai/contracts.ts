import { z } from "zod";

const ElementSchema = z.enum(["木", "火", "土", "金", "水"]);

export const AiScoreBreakdownSchema = z.object({
  bazi: z.number().int().min(0).max(30),
  tone: z.number().int().min(0).max(18),
  meaning: z.number().int().min(0).max(18),
  style: z.number().int().min(0).max(12),
  numerology: z.number().int().min(0).max(12),
  usability: z.number().int().min(0).max(10),
  total: z.number().int().min(0).max(100),
});

export const AiCandidateSchema = z.object({
  full: z.string().trim().min(1).max(32),
  pinyin: z.string().trim().min(1).max(120),
  score: z.number().int().min(0).max(100),
  scoreBreakdown: AiScoreBreakdownSchema,
  meaning: z.string().trim().min(1).max(360),
  reasons: z.array(z.string().trim().min(1).max(180)).max(5),
  basis: z.array(z.string().trim().min(1).max(220)).max(6),
  characters: z
    .array(
      z.object({
        char: z.string().trim().min(1).max(2),
        element: ElementSchema,
        gloss: z.string().trim().min(1).max(160),
      }),
    )
    .min(1)
    .max(12),
});

export const AiExplainRequestSchema = z.object({
  kind: z.enum(["baby", "company"]),
  context: z.object({
    style: z.string().trim().min(1).max(20),
    industry: z.string().trim().min(1).max(40).optional(),
    diagnosis: z.string().trim().min(1).max(360).optional(),
    chart: z
      .object({
        dayElement: ElementSchema,
        strength: z.string().trim().min(1).max(12),
        usefulElements: z.array(ElementSchema).max(5),
        favorableElements: z.array(ElementSchema).max(5),
        lackingElements: z.array(ElementSchema).max(5),
        hourKnown: z.boolean(),
      })
      .optional(),
  }),
  candidates: z.array(AiCandidateSchema).min(1).max(3),
});

export const AiNarrativeSchema = z.object({
  overview: z.string().trim().min(12).max(520),
  recommendation: z.object({
    name: z.string().trim().min(1).max(32),
    reason: z.string().trim().min(8).max(320),
  }),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(32),
        verdict: z.string().trim().min(6).max(240),
        strengths: z.array(z.string().trim().min(2).max(120)).min(1).max(3),
        cautions: z.array(z.string().trim().min(2).max(140)).min(1).max(2),
        bestFor: z.string().trim().min(4).max(180),
      }),
    )
    .min(1)
    .max(3),
  disclaimer: z.string().trim().min(8).max(260),
});

export const AiExplainResponseSchema = AiNarrativeSchema.extend({
  meta: z.object({
    source: z.enum(["cloudflare-workers-ai", "openai-compatible", "local"]),
    model: z.string().nullable(),
    cached: z.boolean(),
    requestId: z.string().min(1),
    latencyMs: z.number().int().min(0),
    notice: z.string().max(240).optional(),
  }),
});

export type AiExplainRequest = z.infer<typeof AiExplainRequestSchema>;
export type AiCandidate = z.infer<typeof AiCandidateSchema>;
export type AiNarrative = z.infer<typeof AiNarrativeSchema>;
export type AiExplainResponse = z.infer<typeof AiExplainResponseSchema>;
