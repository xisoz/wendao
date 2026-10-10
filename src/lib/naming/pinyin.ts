import type { Tone } from "./types";

const MARK: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  o: ["ō", "ó", "ǒ", "ò"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  u: ["ū", "ú", "ǔ", "ù"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

export function toneMark(py: string, tone: number): string {
  const s = py.toLowerCase();
  if (tone < 1 || tone > 4) return s.replaceAll("v", "ü");
  let idx = -1;
  if (s.includes("a")) idx = s.indexOf("a");
  else if (s.includes("e")) idx = s.indexOf("e");
  else if (s.includes("ou")) idx = s.indexOf("o");
  else {
    for (let i = s.length - 1; i >= 0; i--) {
      if ("aeiouv".includes(s[i] ?? "")) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) return s.replaceAll("v", "ü");
  const v = s[idx] ?? "";
  const marked = MARK[v]?.[tone - 1] ?? v;
  return (s.slice(0, idx) + marked + s.slice(idx + 1)).replaceAll("v", "ü");
}

export function pingZe(tone: Tone): "平" | "仄" {
  return tone <= 2 ? "平" : "仄";
}

export function patternOf(tones: number[]): string {
  return tones.map((t) => (t <= 2 ? "平" : "仄")).join("");
}

export function initialOf(py: string): string {
  const s = py.toLowerCase();
  if (s.startsWith("zh") || s.startsWith("ch") || s.startsWith("sh")) return s.slice(0, 2);
  return s.slice(0, 1);
}

/** 收声是否开口、响亮。 */
export function openEnding(py: string): boolean {
  return /([aoe]|an|en|ang|eng|ong|er)$/.test(py);
}
