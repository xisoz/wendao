import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/chrome";
import { fetchArticleList } from "@/lib/site/server-fns";
import { Cover } from "@/components/site/article-bits";
import { fmtDate } from "@/lib/site/format";

type Search = { page?: number; cat?: string };

export const Route = createFileRoute("/articles/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    page: Number(s.page) > 1 ? Math.floor(Number(s.page)) : undefined,
    cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchArticleList({ data: { page: deps.page ?? 1, category: deps.cat } }),
  head: () => ({ meta: [{ title: "文章 · 问道" }, { name: "description", content: "八字、五行、六爻、黄历与取名的入门文章。" }] }),
  component: ArticleList,
});

function ArticleList() {
  const data = Route.useLoaderData();
  const { cat } = Route.useSearch();
  return (
    <SiteShell active="文章">
      <section className="mt-6">
        <p className="landing-kicker"><span aria-hidden="true" /> 阅读 · 命理、术数与取名入门</p>
        <h1 className="mt-3 font-serif text-3xl">文章</h1>
      </section>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/articles" search={{}} className={`article-tag ${!cat ? "is-on" : ""}`}>全部</Link>
        {data.categories.map((c) => (
          <Link key={c.category} to="/articles" search={{ cat: c.category }} className={`article-tag ${cat === c.category ? "is-on" : ""}`}>
            {c.category} <span className="ml-1 opacity-60">{c.n}</span>
          </Link>
        ))}
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2">
        {data.items.map((a) => (
          <li key={a.id}>
            <Link to="/articles/$slug" params={{ slug: a.slug }} className="block rounded-2xl border border-line bg-paper-3 p-3 transition hover:border-ink">
              <Cover src={a.cover} category={a.category} />
              <div className="px-1 pb-1 pt-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  {a.pinned ? <span className="pin-badge">置顶</span> : null}
                  {a.category ? <span>{a.category}</span> : null}
                  <span>{fmtDate(a.published_at)}</span>
                </div>
                <h2 className="mt-1 font-serif text-lg leading-snug">{a.title}</h2>
                {a.summary ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{a.summary}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {data.items.length === 0 ? <p className="mt-8 text-sm text-muted">暂无文章。</p> : null}
      {data.pages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="分页">
          {data.page > 1 ? (
            <Link to="/articles" search={{ cat, page: data.page - 1 }} className="wd-btn wd-btn-ghost">上一页</Link>
          ) : null}
          <span className="tabular-nums text-muted">{data.page} / {data.pages}</span>
          {data.page < data.pages ? (
            <Link to="/articles" search={{ cat, page: data.page + 1 }} className="wd-btn wd-btn-ghost">下一页</Link>
          ) : null}
        </nav>
      ) : null}
    </SiteShell>
  );
}
