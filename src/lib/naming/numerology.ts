import type { El, GridCell, Wuge } from "./types";

const LV = [
  "",
  "大吉", "慎", "大吉", "慎", "大吉", "吉", "吉", "大吉", "慎", "平",
  "大吉", "慎", "大吉", "慎", "大吉", "大吉", "吉", "吉", "慎", "慎",
  "大吉", "平", "大吉", "大吉", "大吉", "平", "吉", "慎", "大吉", "吉",
  "大吉", "大吉", "大吉", "慎", "大吉", "平", "大吉", "吉", "大吉", "平",
  "大吉", "平", "平", "慎", "大吉", "慎", "大吉", "大吉", "平", "平",
  "吉", "大吉", "平", "慎", "吉", "平", "大吉", "吉", "慎", "平",
  "大吉", "慎", "大吉", "慎", "大吉", "平", "大吉", "大吉", "平", "慎",
  "吉", "平", "平", "慎", "平", "慎", "平", "平", "慎", "慎",
  "大吉",
] as const;

const TITLE: Record<number, string> = {
  1: "太极开泰",
  2: "两仪未定",
  3: "三才和合",
  4: "四象待时",
  5: "五行流通",
  6: "安稳和合",
  7: "精悍严谨",
  8: "坚韧周全",
  9: "或成或败",
  10: "终而复始",
  11: "旱苗逢雨",
  12: "进退失据",
  13: "春日牡丹",
  15: "福寿丰厚",
  16: "厚重载物",
  21: "明月中天",
  23: "壮丽日升",
  24: "家门余庆",
  25: "资性英敏",
  31: "春日花开",
  33: "旭日升天",
  37: "独立可任",
  39: "富贵荣华",
  41: "德望可凭",
  45: "顺风扬帆",
  47: "点石成金",
  48: "古松立鹤",
  52: "先见之明",
  61: "名利双收",
  63: "厚实荣昌",
  65: "长寿安稳",
  81: "万物回春",
};

function levelOf(n: number): GridCell["level"] {
  const v = LV[n];
  if (v === "大吉" || v === "吉" || v === "平" || v === "慎") return v;
  return "平";
}

export function reduce81(n: number): number {
  if (n <= 0) return 1;
  if (n <= 81) return n;
  const r = n % 80;
  return r === 0 ? 80 : r;
}

export function numEl(n: number): El {
  const d = reduce81(n) % 10;
  if (d === 1 || d === 2) return "木";
  if (d === 3 || d === 4) return "火";
  if (d === 5 || d === 6) return "土";
  if (d === 7 || d === 8) return "金";
  return "水";
}

export function grid(key: string, n: number): GridCell {
  const reduced = reduce81(n);
  const level = levelOf(reduced);
  return {
    key,
    n,
    reduced,
    el: numEl(reduced),
    level,
    title: TITLE[reduced] ?? `传统作${level}`,
  };
}

export function generates(a: El, b: El): boolean {
  return (
    (a === "木" && b === "火") ||
    (a === "火" && b === "土") ||
    (a === "土" && b === "金") ||
    (a === "金" && b === "水") ||
    (a === "水" && b === "木")
  );
}

export function controls(a: El, b: El): boolean {
  return (
    (a === "木" && b === "土") ||
    (a === "土" && b === "水") ||
    (a === "水" && b === "火") ||
    (a === "火" && b === "金") ||
    (a === "金" && b === "木")
  );
}

function rel(a: El, b: El): "比和" | "相生" | "相泄" | "相克" | "相侮" {
  if (a === b) return "比和";
  if (generates(a, b)) return "相生";
  if (generates(b, a)) return "相泄";
  if (controls(a, b)) return "相克";
  return "相侮";
}

export function wugeScore(w: Wuge): number {
  const pts = (lv: GridCell["level"], wgt: number) =>
    lv === "大吉" ? wgt : lv === "吉" ? Math.round(wgt * 0.55) : lv === "慎" ? -wgt : 0;
  let s = pts(w.ren.level, 12) + pts(w.zong.level, 10) + pts(w.di.level, 6);
  if (w.sancaiGood) s += 4;
  else s -= 4;
  return s;
}

/** 姓、名笔画。单姓天格加一；单名地格加一。复姓按两字实画。 */
export function buildWuge(surname: number[], given: number[]): Wuge | null {
  if (surname.length < 1 || surname.length > 2 || given.length < 1 || given.length > 2) return null;
  if (surname.some((n) => n <= 0) || given.some((n) => n <= 0)) return null;
  const [s1, s2] = surname;
  const [g1, g2] = given;
  let tian: number;
  let ren: number;
  let di: number;
  let zong: number;
  let wai: number;
  if (surname.length === 1 && given.length === 2 && s1 && g1 && g2) {
    tian = s1 + 1;
    ren = s1 + g1;
    di = g1 + g2;
    zong = s1 + g1 + g2;
    wai = g2 + 1;
  } else if (surname.length === 1 && given.length === 1 && s1 && g1) {
    tian = s1 + 1;
    ren = s1 + g1;
    di = g1 + 1;
    zong = s1 + g1;
    wai = 2;
  } else if (surname.length === 2 && given.length === 1 && s1 && s2 && g1) {
    tian = s1 + s2;
    ren = s2 + g1;
    di = g1 + 1;
    zong = s1 + s2 + g1;
    wai = s1 + 1;
  } else if (surname.length === 2 && given.length === 2 && s1 && s2 && g1 && g2) {
    tian = s1 + s2;
    ren = s2 + g1;
    di = g1 + g2;
    zong = s1 + s2 + g1 + g2;
    wai = s1 + g2;
  } else {
    return null;
  }
  const cells = {
    tian: grid("天格", tian),
    ren: grid("人格", ren),
    di: grid("地格", di),
    wai: grid("外格", wai),
    zong: grid("总格", zong),
  };
  const ab = rel(cells.tian.el, cells.ren.el);
  const bc = rel(cells.ren.el, cells.di.el);
  const good =
    (ab === "相生" || ab === "比和") && (bc === "相生" || bc === "比和");
  return {
    ...cells,
    sancai: `${cells.tian.el}${cells.ren.el}${cells.di.el}`,
    sancaiNote: `天${cells.tian.el}→人${cells.ren.el} ${ab}，人${cells.ren.el}→地${cells.di.el} ${bc}`,
    sancaiGood: good,
  };
}

/** 字号只有名、没有姓时，看总笔画的数理。 */
export function brandNumber(strokes: number[]): GridCell | null {
  if (!strokes.length || strokes.some((n) => n <= 0)) return null;
  return grid("字号", strokes.reduce((a, b) => a + b, 0));
}
