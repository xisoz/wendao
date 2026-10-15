import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Disclaimer, SiteShell } from "@/components/site/chrome";
import { fetchArticle } from "@/lib/site/server-fns";
import { Cover } from "@/components/site/article-bits";
import { fmtDate } from "@/lib/site/format";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    const a = await fetchArticle({ data: { slug: params.slug } });
    if (!a) throw notFound();
    return a;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.title} · 问道` }, { name: "description", content: loaderData.summary }]
      : [{ title: "文章 · 问道" }],
  }),
  notFoundComponent: () => (
    <SiteShell active="文章">
      <p className="mt-10 text-center text-ink-soft">文章不存在或尚未发布。</p>
      <p className="mt-4 text-center"><Link to="/articles" className="text-cinnabar">返回文章列表</Link></p>
    </SiteShell>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const a = Route.useLoaderData();
  return (
    <SiteShell active="文章">
      <article className="mt-6">
        <Link to="/articles" className="text-sm text-ink-soft">← 文章</Link>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {a.category ? <span className="article-tag">{a.category}</span> : null}
          <span>{fmtDate(a.published_at)}</span>
        </div>
        <h1 className="mt-3 font-serif text-[1.75rem] leading-snug">{a.title}</h1>
        {a.summary ? <p className="mt-3 text-sm leading-7 text-ink-soft">{a.summary}</p> : null}
        {a.cover ? <div className="mt-5"><Cover src={a.cover} category={a.category} seed={a.slug} /></div> : null}
        {/* html 由 mdToHtml 生成：全文先转义，只输出白名单标签 */}
        <div className="prose-wd mt-4" dangerouslySetInnerHTML={{ __html: a.html }} />
        <Disclaimer />
      </article>
    </SiteShell>
  );
}
