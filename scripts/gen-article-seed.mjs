// 一次性：从 wx-autoreply/data/articles.json 生成文章种子迁移（跳过测试样例）。
import { readFileSync, writeFileSync } from "node:fs";
const src = process.argv[2] ?? "/workspace/wx-autoreply/data/articles.json";
const arts = JSON.parse(readFileSync(src, "utf8")).filter((a) => a.title !== "立冬前后出生，名字怎么取");
const q = (s) => (s == null || s === "" ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const rows = arts.map((a) =>
  `(${q(a.slug)}, ${q(a.title)}, ${q(a.summary)}, ${q(a.body)}, null, ${q(a.category)}, '${String((a.tags || []).join(",")).replace(/'/g, "''")}', 'published', false, ${q(a.publishedAt)}::timestamptz)`,
);
writeFileSync(
  new URL("../migrations/0102_seed_articles.sql", import.meta.url),
  `-- 种子：原公众号 9 篇文章（由 scripts/gen-article-seed.mjs 生成）\ninsert into articles (slug, title, summary, body, cover, category, tags, status, pinned, published_at) values\n${rows.join(",\n")}\non conflict (slug) do nothing;\n`,
);
console.log(rows.length, "articles");
