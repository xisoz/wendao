import { INDUSTRIES, type StyleId } from "./catalog";
import { addElements, buildChart, lackElements } from "./bazi";
import { NAME_POOL, lookup, lookupName } from "./lexicon";
import { brandNumber, buildWuge, generates, wugeScore } from "./numerology";
import { initialOf, openEnding, patternOf, toneMark } from "./pinyin";
import { parseSurname, surnamePinyin } from "./surnames";
import type { Chart, El, Gender, Lexeme, NameIdea, SurnameInfo, Tone } from "./types";

const BAN = new Set("命弱吻呵呼叹告骨骚巫死病亡鬼偷骗恨毒惨坟尸凶祸巾帕布号".split(""));

const BAD_SOUND = ["fanjian", "wangba", "shibai", "daomei", "sangxin", "choulou", "baichi"];

export type BabyRequest = {
  surname: string;
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  givenLen: 1 | 2;
  style: StyleId;
  generation: string;
  generationPos: "front" | "back";
  avoid: string;
  preferred: El[] | null;
  batch?: number;
};

export type CompanyRequest = {
  industryId: string;
  len: 2 | 3;
  style: StyleId;
  avoid: string;
  withSuffix: boolean;
  include: string;
  founder: { year: number; month: number; day: number; hour: number | null; gender: Gender } | null;
  preferred: El[] | null;
  batch?: number;
};

export type NameResult = {
  ideas: NameIdea[];
  chart: Chart | null;
  error?: string;
  yong: El[];
  note?: string;
  diagnosis?: string;
  page: number;
  pages: number;
};

function avoidSet(raw: string): Set<string> {
  return new Set([...raw.trim()].filter((ch) => /\p{Script=Han}/u.test(ch)));
}

function usableBaby(p: Lexeme, gender: Gender, avoid: Set<string>): boolean {
  if (BAN.has(p.c) || avoid.has(p.c)) return false;
  if (p.gloss.length < 4) return false;
  if (p.use === "号") return false;
  if (p.g !== "n" && p.g !== gender) return false;
  return true;
}

function elFit(el: El, yong: El[], xi: El[]): number {
  if (yong.includes(el)) return 22;
  if (xi.includes(el)) return 12;
  if (yong.some((y) => generates(el, y))) return 14;
  return 3;
}

const RARE = new Set("斓绢萝菀缨缭缮罡骊骠鬓髻帕巾布巫骚吻呵呼叹告骨".split(""));

function styleFit(tags: string[], style: StyleId): number {
  if (style === "不限") return 4;
  return tags.includes(style) ? 14 : 0;
}

function toneFit(tones: number[]): number {
  const p = patternOf(tones);
  const good3 = new Set(["平仄平", "仄平仄", "平平仄", "仄仄平"]);
  const good2 = new Set(["平仄", "仄平"]);
  if (new Set(tones).size === 1) return 0;
  if (tones.length >= 3 && good3.has(p)) return 16;
  if (tones.length === 2 && good2.has(p)) return 16;
  if (tones.length >= 3 && (p === "平仄仄" || p === "仄平平")) return 10;
  return 7;
}

function badPhonetics(pys: string[]): boolean {
  const joined = pys.join("");
  return BAD_SOUND.some((s) => joined.includes(s));
}

function naturalFit(chars: Lexeme[], style: StyleId): number {
  let score = 0;
  score -= chars.reduce((s, c) => s + (RARE.has(c.c) ? 14 : 0), 0);
  score -= chars.reduce((s, c) => s + (c.gloss.includes("宜慎") || c.gloss.includes("稍") ? 8 : 0), 0);
  if (chars.length >= 2) {
    const shared = chars[0]?.tags.filter((t) => chars[1]?.tags.includes(t)) ?? [];
    if (shared.length) score += 8;
    if (style !== "不限" && chars.every((c) => c.tags.includes(style))) score += 6;
    if (chars.every((c) => c.st >= 18)) score -= 6;
  }
  return score;
}

function takePage(list: Scored[], batch: number | undefined, size = 12): { picked: Scored[]; page: number; pages: number } {
  const wide = diversify(list, 36);
  const pages = Math.max(1, Math.ceil(wide.length / size));
  const page = ((batch ?? 0) % pages + pages) % pages;
  return { picked: wide.slice(page * size, page * size + size), page, pages };
}

function asLexeme(ch: string): Lexeme | null {
  const named = lookupName(ch);
  if (named) return named;
  const g = lookup(ch);
  if (!g || BAN.has(ch)) return null;
  return { ...g, g: "n", use: "皆", tags: [], gloss: "字库著录其音、部首与康熙笔画" };
}

type Scored = { chars: Lexeme[]; score: number };

function diversify(list: Scored[], n: number): Scored[] {
  const out: Scored[] = [];
  const head = new Map<string, number>();
  const tail = new Map<string, number>();
  const sigs = new Set<string>();
  const push = (item: Scored, loose: boolean) => {
    const a = item.chars[0]?.c ?? "";
    const b = item.chars[item.chars.length - 1]?.c ?? "";
    const sig = item.chars.map((c) => c.c).sort().join("");
    if (sigs.has(sig)) return false;
    if (!loose) {
      if ((head.get(a) ?? 0) >= 1) return false;
      if ((tail.get(b) ?? 0) >= 1) return false;
    }
    out.push(item);
    sigs.add(sig);
    head.set(a, (head.get(a) ?? 0) + 1);
    tail.set(b, (tail.get(b) ?? 0) + 1);
    return true;
  };
  for (const item of list) {
    push(item, false);
    if (out.length >= n) return out;
  }
  for (const item of list) {
    if (out.some((x) => x.chars.map((c) => c.c).join("") === item.chars.map((c) => c.c).join(""))) continue;
    push(item, true);
    if (out.length >= n) break;
  }
  return out;
}

function brief(input: {
  chars: Lexeme[];
  lack: El[];
  yong: El[];
  manual: boolean;
  pattern: string;
  wuge: ReturnType<typeof buildWuge>;
  brandTitle: string | null;
  surname: SurnameInfo | null;
  hourKnown: boolean;
  kind: "baby" | "company";
}): { meaning: string; basis: string[]; note: string; fills: El[]; reasons: string[] } {
  const { chars, lack, manual, pattern, wuge, surname } = input;
  const meaning = chars.map((c) => `${c.c}，${c.gloss}`).join("。") + "。";
  const fills = [...new Set(chars.map((c) => c.el).filter((e) => lack.includes(e)))];
  const own = chars.map((c) => `${c.c}属${c.el}`).join("、");
  const basis: string[] = [];
  if (manual) {
    basis.push(`五行：按手选的${input.yong.join("、")}取字，没有改用命局里的所缺。用字是${own}。`);
  } else if (lack.length) {
    basis.push(
      fills.length
        ? `五行：合姓与四柱之后，所缺是${lack.join("、")}。${own}，补上${fills.join("、")}。`
        : `五行：所缺是${lack.join("、")}。这一组没能直接补上，只作音义备选。用字是${own}。`,
    );
  } else {
    basis.push(`五行：合姓之后没有明显所缺，按喜用${input.yong.join("、")}轻取。用字是${own}。`);
  }
  const tonesOk = pattern === "平仄" || pattern === "仄平" || pattern === "平仄平" || pattern === "仄平仄" || pattern === "平平仄" || pattern === "仄仄平";
  basis.push(`音律：平仄是${pattern}。${tonesOk ? "声调错开，叫起来不粘在一个调上。" : "声调可以接受，没有同音连读。"}`);
  if (wuge) {
    basis.push(
      `笔画：按《康熙字典》繁体口径，人格${wuge.ren.reduced}（${wuge.ren.level}），总格${wuge.zong.reduced}（${wuge.zong.level}）。三才${wuge.sancai}，${wuge.sancaiNote}`,
    );
  } else if (input.brandTitle) {
    basis.push(`笔画：按《康熙字典》繁体口径，字号数理${input.brandTitle}。`);
  }
  if (surname?.els.length) {
    basis.push(`姓氏：${surname.text}属${surname.els.join("、")}，已计入五行，不单看八字。`);
  }
  const note = input.kind === "baby"
    ? `备注：生日按公历换节气排四柱${input.hourKnown ? "" : "，时辰未填，时柱没算"}。缺与弱按干支加权，再加上姓的五行。字义来自取名字库，不是随口凑的。这是对照用的依据，不是命运结论。`
    : `备注：字号先看行业五行${input.hourKnown ? "，并按创办人四柱所缺来补" : ""}。字义与康熙笔画写在上面，方便核对。这是起名参照，不是旺衰承诺。`;
  const reasons = [
    fills.length ? `补${fills.join("、")}。${meaning}` : meaning,
    ...basis,
  ];
  return { meaning, basis, note, fills, reasons };
}

function explainBaby(
  surname: SurnameInfo,
  chars: Lexeme[],
  yong: El[],
  lack: El[],
  manual: boolean,
  hourKnown: boolean,
  style: StyleId,
  wuge: ReturnType<typeof buildWuge>,
): { reasons: string[]; pattern: string; scoreShown: number; meaning: string; basis: string[]; note: string; fills: El[] } {
  const tones = [...surname.pys.map((p) => p.tone), ...chars.map((c) => c.tone)];
  const pattern = patternOf(tones);
  const explained = brief({
    chars,
    lack,
    yong,
    manual,
    pattern,
    wuge,
    brandTitle: null,
    surname,
    hourKnown,
    kind: "baby",
  });
  if (style !== "不限" && chars.some((c) => c.tags.includes(style))) {
    explained.basis.push(`气质：偏向${style}，字的意象与此相符。`);
  }
  const score =
    40 +
    chars.reduce((s, c) => s + elFit(c.el, yong, []), 0) / chars.length +
    toneFit(tones) +
    (wuge ? wugeScore(wuge) : 0) +
    chars.reduce((s, c) => s + styleFit(c.tags, style), 0) / chars.length;
  return { ...explained, pattern, scoreShown: Math.max(48, Math.min(96, Math.round(score))) };
}

export function generateBaby(req: BabyRequest): NameResult {
  const parsed = parseSurname(req.surname);
  if ("error" in parsed) return { ideas: [], chart: null, error: parsed.error, yong: [], page: 0, pages: 0 };
  if (!req.year || !req.month || !req.day) return { ideas: [], chart: null, error: "补上公历生日。", yong: [], page: 0, pages: 0 };
  const chart = buildChart({
    year: req.year,
    month: req.month,
    day: req.day,
    hour: req.hour,
    gender: req.gender,
  });
  const combined = addElements(chart.counts, parsed.els);
  const lack = lackElements(combined);
  const manual = !!(req.preferred && req.preferred.length);
  const yong = manual ? (req.preferred as El[]) : lack.length ? lack : chart.yong;
  const xi = manual ? [] : chart.yong.filter((e) => !yong.includes(e));
  const avoid = avoidSet(req.avoid);
  for (const ch of parsed.chars) avoid.add(ch);
  const fixedRaw = [...req.generation.trim()].find((ch) => /\p{Script=Han}/u.test(ch)) ?? "";
  const fixed = fixedRaw ? asLexeme(fixedRaw) : null;
  if (fixedRaw && !fixed) return { ideas: [], chart, error: `字库没有「${fixedRaw}」，辈分字换一个。`, yong, page: 0, pages: 0 };

  let bag = NAME_POOL.filter((p) => usableBaby(p, req.gender, avoid));
  bag.sort((a, b) => elFit(b.el, yong, xi) + styleFit(b.tags, req.style) - (elFit(a.el, yong, xi) + styleFit(a.tags, req.style)));
  bag = bag.slice(0, 36);
  if (fixed && !bag.some((p) => p.c === fixed.c)) bag = [fixed, ...bag];

  const surnameTones = parsed.pys.map((p) => p.tone);
  const surnamePy = parsed.pys.map((p) => p.py);
  const scored: Scored[] = [];

  const consider = (chars: Lexeme[]) => {
    if (chars.some((c, i) => chars.findIndex((x) => x.c === c.c) !== i)) return;
    if (fixed && !chars.some((c) => c.c === fixed.c)) return;
    if (req.givenLen === 2 && fixed && req.generationPos === "front" && chars[0]?.c !== fixed.c) return;
    if (req.givenLen === 2 && fixed && req.generationPos === "back" && chars[1]?.c !== fixed.c) return;
    const pys = [...surnamePy, ...chars.map((c) => c.py)];
    if (pys.some((p) => !p) || badPhonetics(pys)) return;
    if (new Set(pys).size !== pys.length) return;
    if (!manual && lack.length && !chars.some((c) => lack.includes(c.el))) return;
    const tones = [...surnameTones, ...chars.map((c) => c.tone as number)];
    const w = buildWuge(parsed.strokes, chars.map((c) => c.st));
    let score =
      chars.reduce((s, c) => s + elFit(c.el, yong, xi), 0) / chars.length +
      toneFit(tones) +
      (w ? wugeScore(w) : 0) +
      chars.reduce((s, c) => s + styleFit(c.tags, req.style), 0) / chars.length +
      naturalFit(chars, req.style);
    if (openEnding(chars[chars.length - 1]?.py ?? "")) score += 3;
    const initials = pys.map(initialOf);
    if (initials.length >= 2 && initials.every((x) => x === initials[0])) score -= 8;
    if (yong.length >= 2 && new Set(chars.map((c) => c.el)).size >= 2 && chars.every((c) => yong.includes(c.el) || xi.includes(c.el))) {
      score += 4;
    }
    scored.push({ chars, score });
  };

  if (req.givenLen === 1) {
    for (const a of bag) consider([a]);
  } else {
    for (const a of bag) {
      for (const b of bag) {
        if (a.c === b.c) continue;
        consider([a, b]);
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const { picked, page, pages } = takePage(scored, req.batch);
  const sp = surnamePinyin(parsed);
  const ideas: NameIdea[] = picked.map(({ chars, score }) => {
    const wuge = buildWuge(parsed.strokes, chars.map((c) => c.st));
    const meta = explainBaby(parsed, chars, yong, lack, manual, chart.hourKnown, req.style, wuge);
    const given = chars.map((c) => c.c).join("");
    const py = `${sp} ${chars.map((c) => toneMark(c.py, c.tone)).join(" ")}`.trim();
    return {
      id: `${parsed.text}${given}`,
      full: `${parsed.text}${given}`,
      given,
      pinyin: py,
      score: Math.max(54, Math.min(96, Math.round(64 + score * 0.42))),
      chars,
      pattern: meta.pattern,
      reasons: meta.reasons,
      meaning: meta.meaning,
      basis: meta.basis,
      note: meta.note,
      fills: meta.fills,
      wuge,
      kind: "baby" as const,
    };
  });
  const note = parsed.missing.length
    ? `字库未收${parsed.missing.join("")}的康熙笔画，五格先不计这几个字。`
    : undefined;
  const sur = parsed.els.length ? `姓「${parsed.text}」属${parsed.els.join("、")}，已计入。` : "";
  const baziLack = chart.lack.length ? `四柱偏缺${chart.lack.join("、")}。` : "四柱没有明显所缺。";
  const diagnosis = lack.length
    ? `${baziLack}${sur}合在一起仍宜补${lack.join("、")}，下面的名字优先用这些字。`
    : `${baziLack}${sur}合在一起五行比较齐，名字按喜用轻取。`;
  if (!ideas.length) {
    return { ideas, chart, yong, note, diagnosis, page: 0, pages: 0, error: "这个条件下凑不出名字。放宽气质，或先去掉辈分字。" };
  }
  return { ideas, chart, yong, note, diagnosis, page, pages };
}

export function generateCompany(req: CompanyRequest): NameResult {
  const industry = INDUSTRIES.find((i) => i.id === req.industryId) ?? INDUSTRIES[0];
  if (!industry) return { ideas: [], chart: null, error: "先选行业。", yong: [], page: 0, pages: 0 };
  let chart: Chart | null = null;
  if (req.founder) {
    chart = buildChart({
      year: req.founder.year,
      month: req.founder.month,
      day: req.founder.day,
      hour: req.founder.hour,
      gender: req.founder.gender,
    });
  }
  const lack = chart ? chart.lack : [];
  const manual = !!(req.preferred && req.preferred.length);
  const yong = manual ? (req.preferred as El[]) : lack.length ? lack : industry.els;
  const xi = manual ? [] : chart ? chart.yong.filter((e) => !yong.includes(e)) : industry.els.filter((e) => !yong.includes(e));
  const avoid = avoidSet(req.avoid);
  const fixedRaw = [...req.include.trim()].find((ch) => /\p{Script=Han}/u.test(ch)) ?? "";
  const fixed = fixedRaw ? asLexeme(fixedRaw) : null;
  if (fixedRaw && !fixed) return { ideas: [], chart, error: `字库没有「${fixedRaw}」。`, yong, page: 0, pages: 0 };

  let bag = NAME_POOL.filter((p) => {
    if (BAN.has(p.c) || avoid.has(p.c)) return false;
    if (p.gloss.length < 4) return false;
    return p.use === "号" || p.use === "皆";
  });
  if (bag.length < 24) {
    bag = NAME_POOL.filter((p) => !BAN.has(p.c) && !avoid.has(p.c) && p.gloss.length >= 4);
  }
  bag.sort((a, b) => elFit(b.el, yong, xi) - elFit(a.el, yong, xi));
  bag = bag.slice(0, req.len === 3 ? 16 : 40);
  if (fixed && !bag.some((p) => p.c === fixed.c)) bag = [fixed, ...bag];

  const scored: Scored[] = [];
  const consider = (chars: Lexeme[]) => {
    if (new Set(chars.map((c) => c.c)).size !== chars.length) return;
    if (fixed && !chars.some((c) => c.c === fixed.c)) return;
    const pys = chars.map((c) => c.py);
    if (badPhonetics(pys) || new Set(pys).size !== pys.length) return;
    if (!manual && lack.length && !chars.some((c) => lack.includes(c.el))) return;
    const tones = chars.map((c) => c.tone as number);
    const brand = brandNumber(chars.map((c) => c.st));
    let score =
      chars.reduce((s, c) => s + elFit(c.el, yong, xi), 0) / chars.length +
      toneFit(tones) +
      chars.reduce((s, c) => s + styleFit(c.tags, req.style), 0) / chars.length +
      naturalFit(chars, req.style);
    if (brand?.level === "大吉") score += 8;
    else if (brand?.level === "吉") score += 4;
    else if (brand?.level === "慎") score -= 8;
    if (openEnding(chars[chars.length - 1]?.py ?? "")) score += 3;
    scored.push({ chars, score });
  };

  if (req.len === 2) {
    for (const a of bag) for (const b of bag) if (a.c !== b.c) consider([a, b]);
  } else {
    for (const a of bag) {
      for (const b of bag) {
        if (a.c === b.c) continue;
        for (const c of bag) {
          if (c.c === a.c || c.c === b.c) continue;
          consider([a, b, c]);
        }
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const { picked, page, pages } = takePage(scored, req.batch);
  const suffix = req.withSuffix && industry.suffix ? industry.suffix : "";
  const ideas: NameIdea[] = picked.map(({ chars, score }) => {
    const brand = brandNumber(chars.map((c) => c.st));
    const given = chars.map((c) => c.c).join("");
    const full = `${given}${suffix}`;
    const meta = brief({
      chars,
      lack: manual ? [] : lack,
      yong,
      manual,
      pattern: patternOf(chars.map((c) => c.tone)),
      wuge: null,
      brandTitle: brand ? `${brand.reduced} ${brand.level} · ${brand.title}` : null,
      surname: null,
      hourKnown: !!chart,
      kind: "company",
    });
    if (!chart) meta.basis.unshift(`行业：${industry.name}常取${industry.els.join("、")}。${industry.note}`);
    return {
      id: full,
      full,
      given,
      pinyin: chars.map((c) => toneMark(c.py, c.tone)).join(" "),
      score: Math.max(54, Math.min(96, Math.round(64 + score * 0.42))),
      chars,
      pattern: patternOf(chars.map((c) => c.tone)),
      reasons: meta.reasons,
      meaning: meta.meaning,
      basis: meta.basis,
      note: meta.note,
      fills: meta.fills,
      wuge: null,
      kind: "company" as const,
    };
  });
  const diagnosis = chart
    ? chart.lack.length
      ? `创办人四柱偏缺${chart.lack.join("、")}，字号优先补这一行。行业${industry.name}作参照。`
      : `创办人四柱没有明显所缺，字号按喜用与${industry.name}来取。`
    : `${industry.name}常取${industry.els.join("、")}。${industry.note}`;
  if (!ideas.length) return { ideas, chart, yong, page: 0, pages: 0, diagnosis, error: "这个行业和限制下没有合适字号。换个气质，或去掉指定字。" };
  return { ideas, chart, yong, page, pages, diagnosis, note: chart ? "已按创办人所缺来补字，行业五行写在依据里。" : industry.note };
}
