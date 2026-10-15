import { createServerFn } from "@tanstack/react-start";

/**
 * Public reading must not depend on the local preview database starting.
 * A deployed environment with DATABASE_URL reads the managed article store;
 * an unconfigured/local environment serves the same published seed articles
 * immediately, so the homepage and article links remain dependable.
 */
function hasConfiguredArticleDatabase(): boolean {
  const url = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
  return Boolean(url?.trim());
}

export const fetchArticleList = createServerFn({ method: "GET" })
  .validator((d: { page?: number; category?: string }) => ({
    page: Math.max(1, Math.min(1000, Math.floor(Number(d?.page) || 1))),
    category: typeof d?.category === "string" && d.category.length <= 20 ? d.category : undefined,
  }))
  .handler(async ({ data }) => {
    const { fallbackArticleList } = await import("./fallback-articles");
    if (!hasConfiguredArticleDatabase()) return fallbackArticleList(data);
    try {
      const { getSql } = await import("../db");
      const { listPublic } = await import("./articles-repo");
      const result = await listPublic(await getSql(), data);
      return result.items.length ? result : fallbackArticleList(data);
    } catch {
      return fallbackArticleList(data);
    }
  });

export const fetchArticle = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => ({ slug: String(d?.slug ?? "").slice(0, 100) }))
  .handler(async ({ data }) => {
    const { fallbackArticleBySlug } = await import("./fallback-articles");
    const { mdToHtml, stripLeadingTitle } = await import("./markdown");
    if (!hasConfiguredArticleDatabase()) return fallbackArticleBySlug(data.slug);
    try {
      const { getSql } = await import("../db");
      const { getPublicBySlug } = await import("./articles-repo");
      const a = await getPublicBySlug(await getSql(), data.slug);
      if (a) {
        // 服务端渲染：白名单 Markdown → 已转义 HTML
        const { body, ...rest } = a;
        return { ...rest, html: mdToHtml(stripLeadingTitle(body, a.title)) };
      }
    } catch {
      // 本地预览的嵌入式数据库不可用时，使用相同的已发布种子文章。
    }
    return fallbackArticleBySlug(data.slug);
  });
