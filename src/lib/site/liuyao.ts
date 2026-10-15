// 六爻：以钱代蓍（《火珠林》法）模拟起卦，京房八宫纳甲装卦。移植自 wx-autoreply/lib/liuyao.js。
import { Solar } from "lunar-javascript";

type Bit = 0 | 1;
export type Lines = Bit[];
export const TRI: Record<string, Lines> = { 乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0] };
const TRI_EL: Record<string, string> = { 乾: "金", 兑: "金", 离: "火", 震: "木", 巽: "木", 坎: "水", 艮: "土", 坤: "土" };
const NAJIA: Record<string, [string, string, string, string]> = {
  乾: ["甲", "子寅辰", "壬", "午申戌"], 坤: ["乙", "未巳卯", "癸", "丑亥酉"], 震: ["庚", "子寅辰", "庚", "午申戌"], 巽: ["辛", "丑亥酉", "辛", "未巳卯"],
  坎: ["戊", "寅辰午", "戊", "申戌子"], 离: ["己", "卯丑亥", "己", "酉未巳"], 艮: ["丙", "辰午申", "丙", "戌子寅"], 兑: ["丁", "巳卯丑", "丁", "亥酉未"],
};
const ZHI_EL: Record<string, string> = { 子: "水", 亥: "水", 寅: "木", 卯: "木", 巳: "火", 午: "火", 申: "金", 酉: "金", 辰: "土", 戌: "土", 丑: "土", 未: "土" };
const NAMES: Record<string, string> = {
  乾: "乾为天 天泽履 天火同人 天雷无妄 天风姤 天水讼 天山遁 天地否", 兑: "泽天夬 兑为泽 泽火革 泽雷随 泽风大过 泽水困 泽山咸 泽地萃",
  离: "火天大有 火泽睽 离为火 火雷噬嗑 火风鼎 火水未济 火山旅 火地晋", 震: "雷天大壮 雷泽归妹 雷火丰 震为雷 雷风恒 雷水解 雷山小过 雷地豫",
  巽: "风天小畜 风泽中孚 风火家人 风雷益 巽为风 风水涣 风山渐 风地观", 坎: "水天需 水泽节 水火既济 水雷屯 水风井 坎为水 水山蹇 水地比",
  艮: "山天大畜 山泽损 山火贲 山雷颐 山风蛊 山水蒙 艮为山 山地剥", 坤: "地天泰 地泽临 地火明夷 地雷复 地风升 地水师 地山谦 坤为地",
};
const ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
export const POS = "初二三四五上";
const triOf = (bits: Lines) => ORDER.find((k) => TRI[k].join("") === bits.join(""))!;
export const hexName = (lines: Lines) => NAMES[triOf(lines.slice(3))].split(" ")[ORDER.indexOf(triOf(lines.slice(0, 3)))];

interface PalaceInfo { palace: string; shi: number; kind: string }
const PALACE = new Map<string, PalaceInfo>();
for (const p of ORDER) {
  const base = [...TRI[p], ...TRI[p]] as Lines;
  const seq: [Lines, number, string][] = [[base, 6, "本宫卦"]];
  let cur = [...base] as Lines;
  for (let i = 0; i < 5; i++) { cur = [...cur]; cur[i] = (cur[i] ^ 1) as Bit; seq.push([cur, i + 1, `${"一二三四五"[i]}世卦`]); }
  const you = [...cur] as Lines; you[3] = (you[3] ^ 1) as Bit; seq.push([you, 4, "游魂卦"]);
  const gui = [...TRI[p], ...you.slice(3)] as Lines; seq.push([gui, 3, "归魂卦"]);
  for (const [l, shi, kind] of seq) PALACE.set(l.join(""), { palace: p, shi, kind });
}
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
export const liuqin = (me: string, el: string) =>
  el === me ? "兄弟" : SHENG[me] === el ? "子孙" : KE[me] === el ? "妻财" : KE[el] === me ? "官鬼" : "父母";

export function najia(lines: Lines) {
  const lo = triOf(lines.slice(0, 3)), up = triOf(lines.slice(3));
  return lines.map((_, i) => {
    const [g, z] = i < 3 ? [NAJIA[lo][0], NAJIA[lo][1][i]] : [NAJIA[up][2], NAJIA[up][3][i - 3]];
    return { gan: g, zhi: z, el: ZHI_EL[z] };
  });
}

export function analyze(lines: Lines, moving: number[] = []) {
  const info = PALACE.get(lines.join(""))!, pel = TRI_EL[info.palace], nj = najia(lines);
  const ying = ((info.shi + 2) % 6) + 1;
  const yao = nj.map((x, i) => ({ ...x, yang: !!lines[i], qin: liuqin(pel, x.el), shi: info.shi === i + 1, ying: ying === i + 1, moving: moving.includes(i) }));
  let changed: null | { lines: Lines; name: string; palace: string; kind: string; yao: { gan: string; zhi: string; el: string; qin: string }[] } = null;
  if (moving.length) {
    const cl = lines.map((v, i) => (moving.includes(i) ? v ^ 1 : v)) as Lines, cnj = najia(cl), ci = PALACE.get(cl.join(""))!;
    changed = { lines: cl, name: hexName(cl), palace: ci.palace, kind: ci.kind, yao: cnj.map((x) => ({ ...x, qin: liuqin(pel, x.el) })) }; // 变爻六亲以本卦宫五行论
  }
  return { name: hexName(lines), palace: info.palace, palaceEl: pel, kind: info.kind, shi: info.shi, ying, yao, changed };
}

/** 以钱代蓍：每次三枚，背记 3、字记 2；6 老阴（动）、7 少阳、8 少阴、9 老阳（动）。 */
export function toss(rng: () => number = defaultCoin) {
  return Array.from({ length: 6 }, () => [rng(), rng(), rng()].reduce((s, b) => s + (b ? 3 : 2), 0));
}
function defaultCoin(): number {
  const a = new Uint8Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0] & 1;
}

const SHEN = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];
const SHEN_START: Record<string, number> = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };
const G = SHENG, K: Record<string, string> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
export const monthState = (m: string, e: string) => (m === e ? "旺" : G[m] === e ? "相" : G[e] === m ? "休" : K[e] === m ? "囚" : "死");
export const dayRel = (d: string, e: string) => (d === e ? "扶" : G[d] === e ? "生" : K[d] === e ? "克" : G[e] === d ? "泄" : "耗");
const STATE_WORD: Record<string, string> = { 旺: "临月同气", 相: "得月建生", 休: "生月建而泄", 囚: "克月建而耗", 死: "受月建克" };
const DAY_WORD: Record<string, string> = { 扶: "日辰比扶", 生: "日辰生之", 克: "日辰克之", 泄: "生日辰而泄", 耗: "克日辰而耗" };
export const DISCLAIMER = "以上为传统文化参照，不构成命运结论或决策依据。";
const SENSITIVE = /病|癌|手术|药|官司|诉讼|律师|股票|基金|投资|理财|贷款|币/;

export interface YaoRow {
  pos: string; shen: string; shenShort: string; yang: boolean; mark: "" | "○" | "×";
  qin: string; gan: string; zhi: string; el: string; shi: boolean; ying: boolean;
  change: null | { qin: string; gan: string; zhi: string; el: string; yang: boolean };
}

export function castLiuyao(question: string, { now = Date.now(), rng, sums }: { now?: number; rng?: () => number; sums?: number[] } = {}) {
  const s = sums ?? toss(rng);
  const lines = s.map((v) => (v === 7 || v === 9 ? 1 : 0)) as Lines;
  const moving = s.flatMap((v, i) => (v === 6 || v === 9 ? [i] : []));
  const a = analyze(lines, moving);
  const d = new Date(now + 8 * 3600e3);
  const lunar = Solar.fromYmdHms(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0).getLunar();
  const day: string = lunar.getDayInGanZhiExact(), month: string = lunar.getMonthInGanZhiExact(), xk: string = lunar.getDayXunKongExact();
  const st = SHEN_START[day[0]];
  const q = String(question ?? "").replace(/六爻|起卦|摇卦|占卜|算一卦|问|[:：]/g, "").trim().slice(0, 30);
  const rows: YaoRow[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = a.yao[i], c = a.changed?.yao[i], shen = SHEN[(st + i) % 6];
    rows.push({
      pos: POS[i], shen, shenShort: shen === "勾陈" ? "勾" : shen[1], yang: y.yang, mark: s[i] === 9 ? "○" : s[i] === 6 ? "×" : "",
      qin: y.qin, gan: y.gan, zhi: y.zhi, el: y.el, shi: y.shi, ying: y.ying,
      change: y.moving && c ? { ...c, yang: !y.yang } : null,
    });
  }
  const me = ZHI_EL[month[1]], de = ZHI_EL[day[1]];
  const sy = (y: (typeof a.yao)[number], tag: string) => {
    const ms = monthState(me, y.el), dr = dayRel(de, y.el);
    return { tag, zhi: y.zhi, el: y.el, month: ms, monthWord: STATE_WORD[ms], day: dr, dayWord: DAY_WORD[dr], kong: xk.includes(y.zhi),
      text: `${tag}\u3000${y.zhi}${y.el}\u3000月${month[1]}${ms}（${STATE_WORD[ms]}）\u3000日${day[1]}${dr}${xk.includes(y.zhi) ? "\u3000旬空" : ""}` };
  };
  const shiYing = [sy(a.yao[a.shi - 1], "世爻"), sy(a.yao[a.ying - 1], "应爻")];
  const notes = [
    ...(SENSITIVE.test(q) ? ["所问涉及健康、法律或财务，请以医生、律师或持牌专业人士的意见为准。"] : []),
  ];
  const basis = [
    "以钱代蓍：三枚铜钱掷六次，自下而上成卦。背记 3、字记 2，合 9 为老阳○、6 为老阴×（动爻，自变），7 少阳、8 少阴（静）。《火珠林》法。",
    "装卦：京房八宫定宫与世应，纳甲配干支；六亲按本卦宫五行论，变爻亦从本宫（《卜筮正宗》体例）。",
    "旺衰：月建论旺相休囚死，日辰论生扶克泄耗；旬空依日辰所在之旬（《增删卜易》体例）。",
    "六神依日干起：甲乙起青龙、丙丁起朱雀、戊勾陈、己螣蛇、庚辛白虎、壬癸玄武，自初爻而上。",
    "用神须按所问另取（如问财看妻财、问事业看官鬼），此处只列世应旺衰。",
    "程序以随机数模拟掷钱，不同于亲手摇卦。",
  ];
  return { question: q, sums: s, moving, analysis: a, month, day, xunkong: xk, rows, shiYing, notes, basis };
}

/** 文本卡片（与原公众号回复格式一致，供测试与分享）。 */
export function liuyaoText(question: string, opts: Parameters<typeof castLiuyao>[1] = {}) {
  const r = castLiuyao(question, opts), a = r.analysis, W = "\u3000";
  const lines = r.rows.map((y) => `${y.pos} ${y.shenShort} ${y.yang ? "▅▅▅" : "▅ ▅"}${y.mark || W}${y.qin}${y.gan}${y.zhi}${y.el}${y.shi ? "世" : y.ying ? "应" : W}${y.change ? `→${y.change.qin}${y.change.gan}${y.change.zhi}${y.change.el}` : ""}`);
  const sec = (h: string, b: string | string[]) => [`【${h}】`, ...([] as string[]).concat(b).map((l) => W + l)];
  return [
    `六爻｜${a.name}${a.changed ? " 之 " + a.changed.name : ""}`,
    ...sec("所问", r.question || "未写所问之事"),
    ...sec("时间", [`月建${W}${r.month}月`, `日辰${W}${r.day}日\u3000旬空${r.xunkong}`]),
    ...sec("本卦", [`${a.name}\u3000${a.palace}宫（${a.palaceEl}）${a.kind}`, `世${POS[a.shi - 1]}爻\u3000应${POS[a.ying - 1]}爻`]),
    ...sec("动变", a.changed ? [`动爻\u3000${r.moving.map((i) => POS[i] + "爻").join("、")}`, `变卦\u3000${a.changed.name}（${a.changed.palace}宫${a.changed.kind}）`] : "六爻安静，无动爻。"),
    ...sec("卦象", lines),
    ...sec("世应", r.shiYing.map((x) => x.text)),
    ...sec("说明", [...r.notes, ...r.basis]),
    DISCLAIMER,
  ].join("\n");
}
