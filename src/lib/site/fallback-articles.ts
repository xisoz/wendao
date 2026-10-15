import seedSql from "../../../migrations/0102_seed_articles.sql?raw";
import { PAGE_SIZE, type Article, type ArticleSummary } from "./articles-repo";
import { mdToHtml, stripLeadingTitle } from "./markdown";

type ArticlePage = Omit<Article, "body"> & { html: string };

/**
 * 本地预览没有可用数据库时，仍然让已发布的种子文章可读。
 * 内容直接来自迁移文件，后台数据库可用后仍以数据库中的最新文章为准。
 */
function skipWhitespace(source: string, index: number) {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  return cursor;
}

function readSqlValue(source: string, index: number): [string | null, number] {
  let cursor = skipWhitespace(source, index);
  if (source[cursor] === "'") {
    let value = "";
    cursor += 1;
    while (cursor < source.length) {
      if (source[cursor] !== "'") {
        value += source[cursor];
        cursor += 1;
        continue;
      }
      if (source[cursor + 1] === "'") {
        value += "'";
        cursor += 2;
        continue;
      }
      cursor += 1;
      break;
    }
    // 迁移里的 timestamptz 类型标注等后缀不属于字符串内容。
    while (cursor < source.length && source[cursor] !== "," && source[cursor] !== ")") cursor += 1;
    return [value, cursor];
  }

  const start = cursor;
  while (cursor < source.length && source[cursor] !== "," && source[cursor] !== ")") cursor += 1;
  const raw = source.slice(start, cursor).trim();
  return [raw === "null" ? null : raw, cursor];
}

function parseSeedArticles(source: string): Article[] {
  const valuesStart = source.indexOf("values");
  const end = source.indexOf("on conflict", valuesStart);
  if (valuesStart < 0 || end < 0) return [];

  const articles: Article[] = [];
  let cursor = source.indexOf("(", valuesStart);
  while (cursor >= 0 && cursor < end) {
    cursor += 1;
    const values: Array<string | null> = [];
    for (let field = 0; field < 10; field += 1) {
      const [value, next] = readSqlValue(source, cursor);
      values.push(value);
      cursor = skipWhitespace(source, next);
      if (field < 9) {
        if (source[cursor] !== ",") return articles;
        cursor += 1;
      }
    }
    cursor = skipWhitespace(source, cursor);
    if (source[cursor] !== ")") return articles;
    cursor += 1;

    const [slug, title, summary, body, cover, category, tags, status, pinned, publishedAt] = values;
    if (slug && title && body) {
      const timestamp = publishedAt ?? "2026-10-14T00:00:00.000Z";
      articles.push({
        id: -1000 - articles.length,
        slug,
        title,
        summary: summary ?? "",
        body,
        cover,
        category: category ?? "",
        tags: tags ?? "",
        status: status === "draft" ? "draft" : "published",
        pinned: pinned === "true",
        published_at: publishedAt,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
    cursor = source.indexOf("(", cursor);
  }
  return articles;
}

export const fallbackArticles = parseSeedArticles(seedSql);

function asSummary(article: Article): ArticleSummary {
  const { body, ...summary } = article;
  return summary;
}

export function fallbackArticleList({
  page = 1,
  category,
}: {
  page?: number;
  category?: string;
} = {}) {
  const currentPage = Math.max(1, Math.floor(page) || 1);
  const filtered = fallbackArticles
    .filter((article) => !category || article.category === category)
    .slice()
    .sort((a, b) => {
      const pinnedFirst = Number(b.pinned) - Number(a.pinned);
      if (pinnedFirst) return pinnedFirst;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    });
  const categories = Array.from(
    filtered.reduce((counts, article) => {
      if (article.category) counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .map(([name, n]) => ({ category: name, n }))
    .sort((a, b) => a.category.localeCompare(b.category, "zh-CN"));

  return {
    items: filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(asSummary),
    total: filtered.length,
    page: currentPage,
    pages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    categories,
  };
}

export function fallbackArticleBySlug(slug: string): ArticlePage | null {
  const article = fallbackArticles.find((item) => item.slug === slug);
  if (!article) return null;
  const { body, ...rest } = article;
  return {
    ...rest,
    html: mdToHtml(stripLeadingTitle(body, article.title)),
  };
}
