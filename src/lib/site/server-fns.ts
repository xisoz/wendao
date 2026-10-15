import { createServerFn } from "@tanstack/react-start";

export const fetchArticleList = createServerFn({ method: "GET" })
  .validator((d: { page?: number; category?: string }) => ({
    page: Math.max(1, Math.min(1000, Math.floor(Number(d?.page) || 1))),
    category: typeof d?.category === "string" && d.category.length <= 20 ? d.category : undefined,
  }))
  .handler(async ({ data }) => {
    const { getSql } = await import("../db");
    const { listPublic } = await import("./articles-repo");
    return listPublic(await getSql(), data);
  });

export const fetchArticle = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => ({ slug: String(d?.slug ?? "").slice(0, 100) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("../db");
    const { getPublicBySlug } = await import("./articles-repo");
    const { mdToHtml, stripLeadingTitle } = await import("./markdown");
    const a = await getPublicBySlug(await getSql(), data.slug);
    if (!a) return null;
    // 服务端渲染：白名单 Markdown → 已转义 HTML
    const { body, ...rest } = a;
    return { ...rest, html: mdToHtml(stripLeadingTitle(body, a.title)) };
  });
