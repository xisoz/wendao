import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const NAV = [
  { to: "/name", label: "取名", search: {} },
  { to: "/name", label: "八字", search: { tab: "chart" } },
  { to: "/liuyao", label: "六爻", search: {} },
  { to: "/huangli", label: "黄历", search: {} },
  { to: "/articles", label: "文章", search: {} },
] as const;

/** 站点主导航：手机端横向一行，可滑动。 */
export function SiteNav({ active, className = "" }: { active?: string; className?: string }) {
  return (
    <nav className={`site-nav ${className}`} aria-label="站点导航">
      {NAV.map((n) => (
        <Link
          key={n.label}
          to={n.to}
          search={n.search as never}
          className={`site-nav-link ${active === n.label ? "is-active" : ""}`}
          aria-current={active === n.label ? "page" : undefined}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteShell({ active, children, wide = false }: { active?: string; children: ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto min-h-screen px-4 pb-16 pt-4 sm:px-6 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
      <header className="landing-header flex items-center justify-between gap-4">
        <Link to="/" className="landing-brand inline-flex items-center gap-3" aria-label="返回问道首页">
          <span className="landing-mark" aria-hidden="true">问</span>
          <span className="landing-brand-name block font-serif text-xl leading-none">问道</span>
        </Link>
        <SiteNav active={active} className="hidden sm:flex" />
      </header>
      <SiteNav active={active} className="mt-3 sm:hidden" />
      {children}
      <footer className="landing-footer mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <span>问道 · Name with reason</span>
        <span>传统文化参照，不构成命运结论。</span>
      </footer>
    </main>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-6 border-t border-line pt-4 text-xs leading-6 text-muted">
      {children ?? "以上为传统文化参照，不构成命运结论或决策依据。涉及健康、法律、财务请以专业人士意见为准。"}
    </p>
  );
}

export function Basis({ items, title = "依据" }: { items: string[]; title?: string }) {
  return (
    <section className="basis-box mt-6 rounded-2xl border border-line bg-paper-3 p-4">
      <h2 className="font-serif text-lg">【{title}】</h2>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-ink-soft">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
