// 黄历：lunar-javascript 本地计算。移植自 wx-autoreply/lib/xuan.js 的 huangli。
import { Solar } from "lunar-javascript";

export function bjToday(now = Date.now()) {
  const d = new Date(now + 8 * 3600e3);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

export function parseYmd(s: string | undefined | null) {
  const m = String(s ?? "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (y < 1900 || y > 2100 || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

export const ymd = ({ y, m, d }: { y: number; m: number; d: number }) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export function shiftDay(date: { y: number; m: number; d: number }, n: number) {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function huangli(date: { y: number; m: number; d: number }) {
  const { y, m, d } = date;
  const solar = Solar.fromYmd(y, m, d);
  const l = solar.getLunar();
  const jq: string = l.getJieQi();
  return {
    date: ymd(date),
    week: "日一二三四五六"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
    lunar: `${l.getMonthInChinese()}月${l.getDayInChinese()}`,
    ganzhi: { year: l.getYearInGanZhi() as string, month: l.getMonthInGanZhi() as string, day: l.getDayInGanZhi() as string },
    shengxiao: l.getYearShengXiao() as string,
    jieqi: jq || null,
    yi: l.getDayYi() as string[],
    ji: l.getDayJi() as string[],
    chong: `冲${l.getDayChongDesc()}`,
    sha: `煞${l.getDaySha()}`,
    tianshen: `${l.getDayTianShen()}（${l.getDayTianShenLuck()}）`,
    zhixing: `${l.getZhiXing()}日`,
    pengzu: [l.getPengZuGan() as string, l.getPengZuZhi() as string],
    xiu: `${l.getXiu()}宿（${l.getXiuLuck()}）`,
    nayin: l.getDayNaYin() as string,
    jishen: (l.getDayJiShen() as string[]).slice(0, 6),
    xiongsha: (l.getDayXiongSha() as string[]).slice(0, 6),
    basis: [
      "干支：年柱以立春换年，月柱以节换月，日柱按六十甲子连续纪日（lunar-javascript 计算）。",
      "宜忌：依《协纪辨方书》以建除十二值、神煞吉凶综合推出，各家通书略有出入。",
      "冲煞：日支所冲之生肖，煞方依日支三合局所克之方。",
      "值神：黄道六神（青龙、明堂、金匮、天德、玉堂、司命）为吉，黑道六神为凶。",
      "彭祖百忌：按日干、日支各一句的古代禁忌口诀，作民俗了解。",
    ],
  };
}
