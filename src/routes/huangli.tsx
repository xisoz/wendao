import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Basis, Disclaimer, SiteShell } from "@/components/site/chrome";
import { bjToday, huangli, parseYmd, shiftDay, ymd } from "@/lib/site/huangli";

export const Route = createFileRoute("/huangli")({
  validateSearch: (s: Record<string, unknown>): { d?: string } => (typeof s.d === "string" && parseYmd(s.d) ? { d: s.d } : {}),
  head: () => ({ meta: [{ title: "黄历 · 问道" }, { name: "description", content: "每日黄历：农历、干支、宜忌、冲煞、值神与彭祖百忌。" }] }),
  component: HuangliPage,
});

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-2 border-t border-line py-2 text-sm leading-6">
      <dt className="text-muted">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function HuangliPage() {
  const { d } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [today] = useState(() => bjToday());
  const date = parseYmd(d) ?? today;
  const h = useMemo(() => huangli(date), [date.y, date.m, date.d]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (nd: { y: number; m: number; d: number }) => navigate({ search: { d: ymd(nd) }, replace: true });
  return (
    <SiteShell active="黄历">
      <section className="mt-6">
        <p className="landing-kicker"><span aria-hidden="true" /> 通书 · 每日宜忌</p>
        <h1 className="mt-3 font-serif text-3xl">黄历</h1>
      </section>
      <div className="mt-5 flex items-center gap-2">
        <button type="button" className="wd-btn wd-btn-ghost px-3" onClick={() => go(shiftDay(date, -1))} aria-label="前一天">‹</button>
        <input type="date" className="wd-input text-center" value={h.date} min="1901-01-01" max="2099-12-31"
          onChange={(e) => { const p = parseYmd(e.target.value); if (p) go(p); }} aria-label="选择日期" />
        <button type="button" className="wd-btn wd-btn-ghost px-3" onClick={() => go(shiftDay(date, 1))} aria-label="后一天">›</button>
        <button type="button" className="wd-btn wd-btn-ghost shrink-0 px-3 text-sm" onClick={() => go(today)}>今天</button>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-paper-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{h.date} · 星期{h.week}</p>
            <h2 className="mt-1 font-serif text-3xl">农历{h.lunar}</h2>
          </div>
          <div className="text-right text-sm text-ink-soft">
            <p>{h.ganzhi.year}年 · 属{h.shengxiao}</p>
            {h.jieqi ? <p className="text-cinnabar">{h.jieqi}</p> : null}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-paper p-3">
            <p className="font-serif text-xl text-cinnabar">宜</p>
            <p className="mt-1 text-sm leading-7">{h.yi.join("　") || "诸事不宜"}</p>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <p className="font-serif text-xl">忌</p>
            <p className="mt-1 text-sm leading-7">{h.ji.join("　") || "—"}</p>
          </div>
        </div>
        <dl className="mt-4">
          <Row k="干支">{h.ganzhi.year}年{"　"}{h.ganzhi.month}月{"　"}{h.ganzhi.day}日</Row>
          <Row k="冲煞">{h.chong}{"　"}{h.sha}</Row>
          <Row k="值神">{h.tianshen}{"　"}{h.zhixing}</Row>
          <Row k="星宿">{h.xiu}{"　"}纳音{h.nayin}</Row>
          <Row k="吉神">{h.jishen.join("　")}</Row>
          <Row k="凶煞">{h.xiongsha.join("　")}</Row>
          <Row k="彭祖">{h.pengzu.join("；")}</Row>
        </dl>
      </section>
      <Basis items={h.basis} />
      <Disclaimer />
    </SiteShell>
  );
}
