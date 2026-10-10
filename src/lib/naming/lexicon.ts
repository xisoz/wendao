import { CHARS } from "./chars.gen";
import { POOL } from "./pool.gen";
import type { El, Glyph, Lexeme, Tone } from "./types";

const ELS = new Set<El>(["木", "火", "土", "金", "水"]);

/** 字表把简体错挂到另一个繁体时，改回姓名里实际要计的那一笔。 */
const FIX: Record<string, Partial<Glyph>> = {
  松: { st: 8, trad: "松" },
  才: { st: 4, trad: "才" },
  谷: { st: 7, trad: "谷" },
  宁: { st: 14, trad: "寧", py: "ning", tone: 2 },
  钟: { st: 17, trad: "鍾" },
  行: { py: "xing", tone: 2 },
  乐: { py: "le", tone: 4 },
  给: { py: "ji", tone: 3 },
  折: { py: "zhe", tone: 2 },
  柏: { py: "bo", tone: 2 },
  晟: { py: "sheng", tone: 4 },
};

function cleanLabel(raw: string, fallback: string): string {
  const part = raw.split("、")[0]?.trim() || fallback;
  return part || fallback;
}

function asEl(v: string): El | null {
  return ELS.has(v as El) ? (v as El) : null;
}

function glyphFrom(row: readonly [string, string, number, string, number, string, string]): Glyph | null {
  const el = asEl(row[3]);
  if (!el) return null;
  const c = row[0];
  const fix = FIX[c];
  const tone = (fix?.tone ?? row[2]) as Tone;
  if (tone < 1 || tone > 4) return null;
  return {
    c,
    py: fix?.py ?? row[1],
    tone,
    el: fix?.el ?? el,
    st: fix?.st ?? row[4],
    rad: cleanLabel(row[5], ""),
    trad: fix?.trad ?? cleanLabel(row[6], c),
  };
}

const glyphList: Glyph[] = [];
for (const row of CHARS) {
  const g = glyphFrom(row);
  if (g) glyphList.push(g);
}

export const GLYPHS: Glyph[] = glyphList;

const byChar = new Map<string, Glyph>();
for (const g of GLYPHS) byChar.set(g.c, g);

export function lookup(c: string): Glyph | undefined {
  return byChar.get(c);
}

const poolList: Lexeme[] = [];
const seen = new Set<string>();
for (const row of POOL) {
  const base = glyphFrom([row[0], row[1], row[2], row[3], row[4], row[5], row[6]]);
  if (!base || seen.has(base.c)) continue;
  const g = row[7];
  const use = row[8];
  if (g !== "m" && g !== "f" && g !== "n") continue;
  if (use !== "人" && use !== "号" && use !== "皆") continue;
  seen.add(base.c);
  poolList.push({
    ...base,
    g,
    use,
    tags: row[9].split(" ").filter(Boolean),
    gloss: row[10],
  });
}

export const NAME_POOL: Lexeme[] = poolList;

const poolByChar = new Map<string, Lexeme>();
for (const p of NAME_POOL) poolByChar.set(p.c, p);

export function lookupName(c: string): Lexeme | undefined {
  return poolByChar.get(c);
}

export function searchGlyphs(q: string, el: El | "全部"): Glyph[] {
  const query = q.trim().toLowerCase();
  const out: Glyph[] = [];
  for (const g of GLYPHS) {
    if (el !== "全部" && g.el !== el) continue;
    if (!query) {
      out.push(g);
      if (out.length >= 48) break;
      continue;
    }
    if (g.c === query || g.trad === query || g.py.startsWith(query)) out.push(g);
    if (out.length >= 40) break;
  }
  return out;
}
