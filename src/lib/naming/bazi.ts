import { Solar } from "lunar-javascript";
import type { Chart, El, Gender, LuckStep, Pillar } from "./types";
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

export function buildChart(input: {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  gender: Gender | null;
  flowYear?: number;
}): Chart {
  const hourKnown = input.hour !== null;
  const hour = input.hour ?? 12;
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, hour, 30, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const specs: { label: string; gan: string; zhi: string; hide: string[]; shiGan: string; shiZhi: string[]; nayin: string; dishi: string }[] = [
    {
      label: "年",
      gan: ec.getYearGan(),
      zhi: ec.getYearZhi(),
      hide: ec.getYearHideGan(),
      shiGan: ec.getYearShiShenGan(),
      shiZhi: ec.getYearShiShenZhi(),
      nayin: ec.getYearNaYin(),
      dishi: ec.getYearDiShi(),
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
      }));
    currentYun = daYun.find((d) => flowYear >= d.startYear && flowYear <= d.endYear) ?? null;
    const host = yun.getDaYun(9).find((d) => flowYear >= d.getStartYear() && flowYear <= d.getEndYear());
    const ln = host?.getLiuNian(12).find((n) => n.getYear() === flowYear);
    flowGanZhi = ln?.getGanZhi() ?? Solar.fromYmd(flowYear, 6, 1).getLunar().getYearInGanZhi();
  } else {
    flowGanZhi = Solar.fromYmd(flowYear, 6, 1).getLunar().getYearInGanZhi();
  }

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
    zodiac: lunar.getYearShengXiao(),
    counts,
    lack,
    strength,
    yong,
    xi,
    tiao,
    summary,
    yongText,
    yearText,
    startText,
    daYun,
    currentYun,
    flowYear,
    flowGanZhi,
    hourKnown,
  };
}
