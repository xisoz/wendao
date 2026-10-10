import type { El } from "./types";

export const STYLES = ["不限", "清雅", "温润", "大气", "书卷", "明朗", "古意", "坚毅"] as const;
export type StyleId = (typeof STYLES)[number];

export const INDUSTRIES: {
  id: string;
  name: string;
  els: El[];
  suffix: string;
  note: string;
}[] = [
  { id: "tech", name: "科技", els: ["金", "水"], suffix: "科技", note: "金主锋与规矩，水主流通与智。" },
  { id: "edu", name: "教育", els: ["木", "火"], suffix: "教育", note: "木是生长，火是照见。" },
  { id: "food", name: "餐饮", els: ["火", "土"], suffix: "", note: "火是人气与烹，土是承托。" },
  { id: "money", name: "金融", els: ["金", "水"], suffix: "", note: "金是信，水是周转。" },
  { id: "health", name: "医疗健康", els: ["木", "水"], suffix: "", note: "木生发，水滋养。" },
  { id: "build", name: "建筑营造", els: ["土", "金"], suffix: "营造", note: "土是基，金是结构。" },
  { id: "design", name: "设计文化", els: ["木", "火"], suffix: "文化", note: "木是生发，火是表现。" },
  { id: "trade", name: "贸易", els: ["水", "金"], suffix: "贸易", note: "水是往来，金是契约。" },
  { id: "agri", name: "农林食材", els: ["木", "土"], suffix: "", note: "木是生长，土是收成。" },
  { id: "law", name: "法律咨询", els: ["金", "土"], suffix: "", note: "金是裁断，土是持重。" },
  { id: "media", name: "传媒", els: ["火", "水"], suffix: "传媒", note: "火是传播，水是到达。" },
  { id: "travel", name: "文旅", els: ["水", "木"], suffix: "", note: "水是远行，木是可居。" },
];
