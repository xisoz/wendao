export type SavedName = {
  id: string;
  full: string;
  pinyin: string;
  score: number;
  kind: "baby" | "company";
  note: string;
  at: number;
};

const KEY = "ziheng.book.v1";

export function loadSaved(): SavedName[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((row) => row && typeof row === "object" && typeof (row as SavedName).full === "string") as SavedName[];
  } catch {
    return [];
  }
}

export function writeSaved(list: SavedName[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
}
