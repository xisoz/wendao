export type El = "木" | "火" | "土" | "金" | "水";
export type Tone = 1 | 2 | 3 | 4;
export type Gender = "m" | "f";

export type Glyph = {
  c: string;
  py: string;
  tone: Tone;
  el: El;
  st: number;
  rad: string;
  trad: string;
};

export type Lexeme = Glyph & {
  g: Gender | "n";
  use: "人" | "号" | "皆";
  tags: string[];
  gloss: string;
};

export type Pillar = {
  label: string;
  gan: string;
  zhi: string;
  ganEl: El;
  zhiEl: El;
  hide: string[];
  shiGan: string;
  shiZhi: string[];
  nayin: string;
  dishi: string;
  known: boolean;
};

export type LuckStep = {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
};

export type Chart = {
  pillars: Pillar[];
  dayGan: string;
  dayEl: El;
  monthZhi: string;
  lunar: string;
  zodiac: string;
  counts: Record<El, number>;
  lack: El[];
  strength: "身强" | "中和" | "身弱";
  yong: El[];
  xi: El[];
  tiao: string;
  summary: string;
  yongText: string;
  yearText: string;
  startText: string;
  daYun: LuckStep[];
  currentYun: LuckStep | null;
  flowYear: number;
  flowGanZhi: string;
  hourKnown: boolean;
};

export type GridCell = {
  key: string;
  n: number;
  reduced: number;
  el: El;
  level: "大吉" | "吉" | "平" | "慎";
  title: string;
};

export type Wuge = {
  tian: GridCell;
  ren: GridCell;
  di: GridCell;
  wai: GridCell;
  zong: GridCell;
  sancai: string;
  sancaiNote: string;
  sancaiGood: boolean;
};

export type NameIdea = {
  id: string;
  full: string;
  given: string;
  pinyin: string;
  score: number;
  chars: Lexeme[];
  pattern: string;
  reasons: string[];
  meaning: string;
  basis: string[];
  note: string;
  fills: El[];
  wuge: Wuge | null;
  kind: "baby" | "company";
};

export type SurnameInfo = {
  text: string;
  chars: string[];
  strokes: number[];
  pys: { py: string; tone: Tone }[];
  els: El[];
  missing: string[];
};
