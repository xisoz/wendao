import { lookup } from "./lexicon";
import { toneMark } from "./pinyin";
import type { El, SurnameInfo, Tone } from "./types";

const COMPOUNDS = [
  "欧阳", "太史", "端木", "上官", "司马", "东方", "独孤", "南宫", "万俟", "闻人", "夏侯", "诸葛",
  "尉迟", "公羊", "赫连", "澹台", "皇甫", "宗政", "濮阳", "公冶", "太叔", "申屠", "公孙", "慕容",
  "仲孙", "钟离", "长孙", "宇文", "司徒", "鲜于", "司空", "闾丘", "子车", "亓官", "司寇", "巫马",
  "公西", "颛孙", "壤驷", "公良", "漆雕", "乐正", "宰父", "谷梁", "拓跋", "夹谷", "轩辕", "令狐",
  "段干", "百里", "呼延", "东郭", "南门", "羊舌", "微生", "西门", "第五", "公乘", "南荣", "东里",
  "仲长", "子书", "即墨", "达奚", "褚师", "左丘",
].sort((a, b) => b.length - a.length);

const SURNAME_PY: Record<string, [string, Tone]> = {
  单: ["shan", 4],
  区: ["ou", 1],
  仇: ["qiu", 2],
  查: ["zha", 1],
  曾: ["zeng", 1],
  解: ["xie", 4],
  乐: ["yue", 4],
  盖: ["ge", 3],
  华: ["hua", 4],
  任: ["ren", 2],
  纪: ["ji", 3],
  缪: ["miao", 4],
  覃: ["qin", 2],
  万: ["wan", 4],
  燕: ["yan", 1],
  尉: ["yu", 4],
  朴: ["piao", 2],
  翟: ["zhai", 2],
  召: ["shao", 4],
  种: ["chong", 2],
  宁: ["ning", 4],
  阚: ["kan", 4],
  繁: ["po", 2],
  折: ["she", 2],
  员: ["yun", 4],
  句: ["gou", 1],
  能: ["nai", 4],
  那: ["na", 1],
  冼: ["xian", 3],
  莘: ["shen", 1],
  行: ["xing", 2],
  车: ["che", 1],
  盛: ["sheng", 4],
  秘: ["bi", 4],
  柏: ["bai", 3],
  贾: ["jia", 3],
  肖: ["xiao", 1],
};

export function parseSurname(raw: string): SurnameInfo | { error: string } {
  const text = raw.trim();
  if (!text) return { error: "先写下姓。" };
  if ([...text].some((ch) => !/\p{Script=Han}/u.test(ch))) {
    return { error: "姓氏请用汉字。" };
  }
  const compound = COMPOUNDS.find((n) => n === text);
  const chars = [...text];
  if (!compound && chars.length > 2) return { error: "单姓一个字，复姓两个字。" };
  if (chars.length < 1) return { error: "先写下姓。" };
  const missing: string[] = [];
  const strokes: number[] = [];
  const pys: { py: string; tone: Tone }[] = [];
  const els: El[] = [];
  for (const ch of chars) {
    const g = lookup(ch);
    const over = SURNAME_PY[ch];
    if (!g && !over) missing.push(ch);
    strokes.push(g?.st ?? 0);
    pys.push(over ? { py: over[0], tone: over[1] } : { py: g?.py ?? "", tone: g?.tone ?? 1 });
    if (g) els.push(g.el);
  }
  return { text, chars, strokes, pys, els, missing };
}

export function surnamePinyin(info: SurnameInfo): string {
  return info.pys.map((p) => (p.py ? toneMark(p.py, p.tone) : "")).join(" ");
}
