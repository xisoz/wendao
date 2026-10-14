import { Solar } from "lunar-javascript";
import type { Chart, El, FlowMonth, Gender, LuckStep, LuckYear, Pillar, ShenSha } from "./types";
import { controls, generates } from "./numerology";

export const STEM_EL: Record<string, El> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

export const BRANCH_EL: Record<string, El> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
};

const PARENT: Record<El, El> = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };

export const HOURS: { id: string; name: string; range: string }[] = [
  { id: "0", name: "子", range: "00–01" },
  { id: "2", name: "丑", range: "01–03" },
  { id: "4", name: "寅", range: "03–05" },
  { id: "6", name: "卯", range: "05–07" },
  { id: "8", name: "辰", range: "07–09" },
  { id: "10", name: "巳", range: "09–11" },
  { id: "12", name: "午", range: "11–13" },
  { id: "14", name: "未", range: "13–15" },
  { id: "16", name: "申", range: "15–17" },
  { id: "18", name: "酉", range: "17–19" },
  { id: "20", name: "戌", range: "19–21" },
  { id: "22", name: "亥", range: "21–23" },
];

export function validDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function emptyCounts(): Record<El, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

function scarcest(els: El[], counts: Record<El, number>): El[] {
  const uniq = [...new Set(els)];
  uniq.sort((a, b) => counts[a] - counts[b] || a.localeCompare(b, "zh"));
  return uniq.slice(0, 2);
}

export function elementState(n: number): "缺" | "弱" | "平" | "旺" {
  if (n < 0.6) return "缺";
  if (n < 1.5) return "弱";
  if (n >= 3.2) return "旺";
  return "平";
}

/** 先取近乎没有的，没有则取偏弱的。都齐则返回空。 */
export function lackElements(counts: Record<El, number>): El[] {
  const order: El[] = ["木", "火", "土", "金", "水"];
  const que = order.filter((el) => counts[el] < 0.6);
  if (que.length) return que;
  return order.filter((el) => counts[el] < 1.5);
}

export function addElements(counts: Record<El, number>, els: El[]): Record<El, number> {
  const next = { ...counts };
  for (const el of els) next[el] += 1;
  return next;
}

const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

function dateParts(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

function formatDate(date: Date): string {
  const [year, month, day, hour, minute] = dateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function equationOfTime(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - start) / 86_400_000) + 1;
  const angle = (2 * Math.PI * (day - 81)) / 364;
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
}

function solarTimes(input: { year: number; month: number; day: number; hour: number; longitude?: number | null }) {
  const clock = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, 30, 0));
  const longitude = typeof input.longitude === "number" && Number.isFinite(input.longitude) ? input.longitude : null;
  const offset = longitude === null ? 0 : Math.round((longitude - 120) * 4 + equationOfTime(clock));
  const trueSolar = new Date(clock.getTime() + offset * 60_000);
  const [year, month, day, hour, minute] = dateParts(trueSolar);
  return {
    clock,
    trueSolar,
    offset,
    longitude,
    solar: Solar.fromYmdHms(year, month, day, hour, minute, 0),
  };
}

function branchHits(branches: string[], pool: string): string[] {
  return [...new Set(branches.filter((branch) => pool.includes(branch)))];
}

function buildShenSha(dayGan: string, yearZhi: string, knownBranches: string[], dayXunKong: string): ShenSha[] {
  const tianYi: Record<string, string> = {
    甲: "丑未", 戊: "丑未", 庚: "丑未",
    乙: "子申", 己: "子申",
    丙: "亥酉", 丁: "亥酉",
    壬: "卯巳", 癸: "卯巳",
    辛: "寅午",
  };
  const wenChang: Record<string, string> = {
    甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯",
  };
  const luShen: Record<string, string> = {
    甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
  };
  const yangRen: Record<string, string> = {
    甲: "卯", 乙: "辰", 丙: "午", 丁: "未", 戊: "午", 己: "未", 庚: "酉", 辛: "戌", 壬: "子", 癸: "丑",
  };
  const groupStar = (name: string, mapping: Record<string, string>, source: string, note: string): ShenSha => {
    const branches = mapping[source] ?? "";
    return { name, branches: [...branches], hits: branchHits(knownBranches, branches), note };
  };
  const groupBranchStar = (name: string, source: string, mapping: Record<string, string>, note: string): ShenSha => {
    const branches = Object.entries(mapping).find(([key]) => key.includes(source))?.[1] ?? "";
    return { name, branches: [...branches], hits: branchHits(knownBranches, branches), note };
  };
  return [
    groupStar("天乙贵人", tianYi, dayGan, "以日干起贵人，命盘出现对应地支时标记。"),
    groupStar("文昌", wenChang, dayGan, "以日干取文昌，作为学习、表达的传统参照。"),
    groupStar("禄神", luShen, dayGan, "以日干取禄神，作为职业与承载力的传统参照。"),
    groupStar("羊刃", yangRen, dayGan, "以日干取羊刃，只作结构提示，不单独判吉凶。"),
    groupBranchStar("桃花", yearZhi, { 寅午戌: "卯", 申子辰: "酉", 巳酉丑: "午", 亥卯未: "子" }, "以年支取桃花，常用于观察人缘与审美表达。"),
    groupBranchStar("驿马", yearZhi, { 寅午戌: "申", 申子辰: "寅", 巳酉丑: "亥", 亥卯未: "巳" }, "以年支取驿马，常用于观察迁动与变化。"),
    groupBranchStar("华盖", yearZhi, { 寅午戌: "戌", 申子辰: "辰", 巳酉丑: "丑", 亥卯未: "未" }, "以年支取华盖，常用于观察独处、专长与精神性。"),
    { name: "日空", branches: [...dayXunKong], hits: branchHits(knownBranches, dayXunKong), note: "日柱所在旬的空亡地支，遇到时只作结构提示。" },
  ].map((item) => ({ ...item, branches: item.branches.filter((branch) => BRANCHES.includes(branch)) }));
}

export function buildChart(input: {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  gender: Gender | null;
  longitude?: number | null;
  flowYear?: number;
}): Chart {
  const hourKnown = input.hour !== null;
  const hour = input.hour ?? 12;
  const solarData = solarTimes({ year: input.year, month: input.month, day: input.day, hour, longitude: input.longitude });
  const solar = solarData.solar;
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const specs: { label: string; gan: string; zhi: string; hide: string[]; shiGan: string; shiZhi: string[]; nayin: string; dishi: string; xun: string; xunKong: string }[] = [
    {
      label: "年",
      gan: ec.getYearGan(),
      zhi: ec.getYearZhi(),
      hide: ec.getYearHideGan(),
      shiGan: ec.getYearShiShenGan(),
      shiZhi: ec.getYearShiShenZhi(),
      nayin: ec.getYearNaYin(),
      dishi: ec.getYearDiShi(),
      xun: ec.getYearXun(),
      xunKong: ec.getYearXunKong(),
    },
    {
      label: "月",
      gan: ec.getMonthGan(),
      zhi: ec.getMonthZhi(),
      hide: ec.getMonthHideGan(),
      shiGan: ec.getMonthShiShenGan(),
      shiZhi: ec.getMonthShiShenZhi(),
      nayin: ec.getMonthNaYin(),
      dishi: ec.getMonthDiShi(),
      xun: ec.getMonthXun(),
      xunKong: ec.getMonthXunKong(),
    },
    {
      label: "日",
      gan: ec.getDayGan(),
      zhi: ec.getDayZhi(),
      hide: ec.getDayHideGan(),
      shiGan: ec.getDayShiShenGan(),
      shiZhi: ec.getDayShiShenZhi(),
      nayin: ec.getDayNaYin(),
      dishi: ec.getDayDiShi(),
      xun: ec.getDayXun(),
      xunKong: ec.getDayXunKong(),
    },
    {
      label: "时",
      gan: ec.getTimeGan(),
      zhi: ec.getTimeZhi(),
      hide: ec.getTimeHideGan(),
      shiGan: ec.getTimeShiShenGan(),
      shiZhi: ec.getTimeShiShenZhi(),
      nayin: ec.getTimeNaYin(),
      dishi: ec.getTimeDiShi(),
      xun: ec.getTimeXun(),
      xunKong: ec.getTimeXunKong(),
    },
  ];

  const pillars: Pillar[] = specs.map((s, i) => {
    const known = i < 3 || hourKnown;
    return {
      ...s,
      ganEl: STEM_EL[s.gan] ?? "土",
      zhiEl: BRANCH_EL[s.zhi] ?? "土",
      known,
    };
  });

  const dayGan = pillars[2]?.gan ?? "甲";
  const dayEl = STEM_EL[dayGan] ?? "木";
  const monthZhi = pillars[1]?.zhi ?? "寅";
  const monthEl = BRANCH_EL[monthZhi] ?? "木";
  const counts = emptyCounts();
  pillars.forEach((p, i) => {
    if (!p.known) return;
    const stemW = i === 1 ? 1.25 : 1;
    const branchW = i === 1 ? 1.7 : 1;
    counts[p.ganEl] += stemW;
    counts[p.zhiEl] += branchW;
  });

  const parent = PARENT[dayEl];
  const produced = (["木", "火", "土", "金", "水"] as El[]).find((e) => generates(dayEl, e)) ?? "火";
  const wealth = (["木", "火", "土", "金", "水"] as El[]).find((e) => controls(dayEl, e)) ?? "土";
  const officer = (["木", "火", "土", "金", "水"] as El[]).find((e) => controls(e, dayEl)) ?? "金";

  let support = counts[dayEl] + counts[parent];
  let drain = counts[produced] + counts[officer] + counts[wealth] * 0.65;
  if (monthEl === dayEl || monthEl === parent) support += 1.5;
  if (monthEl === officer) drain += 1.4;
  if (monthEl === produced) drain += 0.7;
  const ratio = support / Math.max(0.01, support + drain);
  const strength: Chart["strength"] = ratio >= 0.58 ? "身强" : ratio <= 0.46 ? "身弱" : "中和";

  let tiao = "";
  let tiaoEl: El | null = null;
  if ("亥子丑".includes(monthZhi)) {
    tiao = "生在寒月，火可以调候。";
    tiaoEl = "火";
  } else if ("巳午未".includes(monthZhi)) {
    tiao = "生在暑月，水可以调候。";
    tiaoEl = "水";
  } else if ("申酉".includes(monthZhi)) {
    tiao = "秋气偏肃，火可以暖局。";
    tiaoEl = "火";
  }

  let yong: El[] = [];
  let xi: El[] = [];
  if (strength === "身强") {
    yong = scarcest([officer, produced, wealth], counts);
    xi = tiaoEl && !yong.includes(tiaoEl) ? [tiaoEl] : [];
  } else if (strength === "身弱") {
    yong = scarcest([parent, dayEl], counts);
    if (yong.length < 2) yong = [parent, dayEl];
    xi = tiaoEl && !yong.includes(tiaoEl) ? [tiaoEl] : [];
  } else {
    yong = tiaoEl ? [tiaoEl] : scarcest([parent, produced], counts).slice(0, 1);
    const rest = scarcest(
      (["木", "火", "土", "金", "水"] as El[]).filter((e) => !yong.includes(e) && e !== officer),
      counts,
    );
    xi = rest.slice(0, 1);
  }

  const ranked = (Object.entries(counts) as [El, number][]).sort((a, b) => b[1] - a[1]);
  const most = ranked[0]?.[0] ?? "木";
  const least = ranked[ranked.length - 1]?.[0] ?? "水";
  const lack = lackElements(counts);
  const strengthWord =
    strength === "身强" ? "日主偏旺，喜泄、耗、克" : strength === "身弱" ? "日主偏弱，喜生、扶" : "日主中和，取名宜轻补，不必硬补一行使之偏";

  const summary = `日主${dayGan}${dayEl}，生于${monthZhi}月。${strengthWord}。盘中${most}较旺，${least}较瘦。${hourKnown ? "" : "时辰未定，时柱没有计入。"}`;
  const yongText = lack.length
    ? `四柱所缺：${lack.join("、")}。取名先补所缺。喜用是${yong.join("、")}，只作参照，不和所缺混成一件事。${tiao}`
    : `四柱没有明显所缺。喜用是${yong.join("、")}，取名轻补即可。${tiao}`;

  const flowYear = input.flowYear ?? new Date().getFullYear();
  let daYun: LuckStep[] = [];
  let liuNian: LuckYear[] = [];
  const currentMonth = new Date().getFullYear() === flowYear ? new Date().getMonth() + 1 : 0;
  const liuYue: FlowMonth[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const lunar = Solar.fromYmd(flowYear, month, 15).getLunar();
    const ganZhi = lunar.getMonthInGanZhi();
    return { month, ganZhi, el: STEM_EL[ganZhi.slice(0, 1)] ?? "土", current: month === currentMonth };
  });
  let startText = input.gender ? "" : "未选性别，大运顺逆暂不确定。";
  let currentYun: LuckStep | null = null;
  let flowGanZhi = "";
  if (input.gender) {
    const yun = ec.getYun(input.gender === "m" ? 1 : 0);
    startText = `约 ${yun.getStartYear()} 岁 ${yun.getStartMonth()} 个月起运。`;
    daYun = yun
      .getDaYun(9)
      .filter((d) => d.getIndex() > 0 && d.getGanZhi())
      .map((d) => ({
        ganZhi: d.getGanZhi(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        startAge: d.getStartAge(),
        endAge: d.getEndAge(),
        liuNian: d.getLiuNian(12).map((n) => ({
          year: n.getYear(),
          ganZhi: n.getGanZhi(),
          el: STEM_EL[n.getGanZhi().slice(0, 1)] ?? "土",
          yun: d.getGanZhi(),
        })),
      }));
    currentYun = daYun.find((d) => flowYear >= d.startYear && flowYear <= d.endYear) ?? null;
    const host = yun.getDaYun(9).find((d) => flowYear >= d.getStartYear() && flowYear <= d.getEndYear());
    const ln = host?.getLiuNian(12).find((n) => n.getYear() === flowYear);
    flowGanZhi = ln?.getGanZhi() ?? Solar.fromYmd(flowYear, 6, 1).getLunar().getYearInGanZhi();
  } else {
    flowGanZhi = Solar.fromYmd(flowYear, 6, 1).getLunar().getYearInGanZhi();
  }

  const seenYears = new Set<number>();
  liuNian = daYun
    .flatMap((d) => d.liuNian ?? [])
    .filter((year) => year.year >= flowYear - 2 && year.year <= flowYear + 10)
    .filter((year) => {
      if (seenYears.has(year.year)) return false;
      seenYears.add(year.year);
      return true;
    })
    .map((year) => ({ ...year, current: year.year === flowYear }));

  const knownBranches = pillars.filter((p) => p.known).map((p) => p.zhi);
  const taiYuan = ec.getTaiYuan();
  const taiXi = ec.getTaiXi();
  const mingGong = hourKnown ? ec.getMingGong() : null;
  const shenGong = hourKnown ? ec.getShenGong() : null;
  const shenSha = buildShenSha(dayGan, pillars[0]?.zhi ?? "子", knownBranches, ec.getDayXunKong());
  const basis = [
    "节气换月：按出生时刻对应的节气划分年柱、月柱。",
    solarData.longitude === null
      ? "真太阳时：未输入出生地经度，暂按标准时间排盘。"
      : `真太阳时：按东经 ${solarData.longitude}° 与均时差校正，已修正 ${solarData.offset >= 0 ? "+" : ""}${solarData.offset} 分钟。`,
    hourKnown ? "时柱：已按所选时辰参与五行、十神、命宫与身宫计算。" : "时柱：未填时辰，时柱、命宫、身宫和相关神煞不作确定判断。",
    "十神、藏干、纳音、十二长生、胎元、胎息、命宫、身宫均由本地排盘规则推导。",
    "神煞按常用年支、日干规则列出，只作结构提示，不单独决定吉凶。",
    "大运顺逆按年干阴阳与性别推导；流年按对应大运展开。",
  ];

  const flowStem = flowGanZhi.slice(0, 1);
  const flowEl = STEM_EL[flowStem] ?? "土";
  const helps = yong.includes(flowEl) || xi.includes(flowEl);
  const yearText = `${flowYear} 年流年 ${flowGanZhi}，天干属${flowEl}。${
    helps ? "这一年的天干靠近用神，宜做事，名字仍按一辈子的喜用取，不迁就某一年。" : "这一年的天干不是用神本身。流年一过就换，名字按命局的长期平衡来写。"
  }${currentYun ? ` 当前大运 ${currentYun.ganZhi}（${currentYun.startYear}–${currentYun.endYear}）。` : ""}`;

  return {
    pillars,
    dayGan,
    dayEl,
    monthZhi,
    lunar: lunar.toString(),
    solarTime: hourKnown ? formatDate(solarData.clock) : `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")} 未填时辰`,
    trueSolarTime: hourKnown ? formatDate(solarData.trueSolar) : "未校正（时辰未知）",
    longitude: solarData.longitude,
    trueSolarOffset: solarData.offset,
    zodiac: lunar.getYearShengXiao(),
    counts,
    lack,
    strength,
    yong,
    xi,
    tiao,
    taiYuan,
    taiYuanNaYin: ec.getTaiYuanNaYin(),
    taiXi,
    taiXiNaYin: ec.getTaiXiNaYin(),
    mingGong,
    mingGongNaYin: mingGong ? ec.getMingGongNaYin() : null,
    shenGong,
    shenGongNaYin: shenGong ? ec.getShenGongNaYin() : null,
    shenSha,
    summary,
    yongText,
    yearText,
    startText,
    daYun,
    liuNian,
    liuYue,
    currentYun,
    flowYear,
    flowGanZhi,
    hourKnown,
    basis,
  };
}
