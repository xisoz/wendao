import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Basis, Disclaimer, SiteShell } from "@/components/site/chrome";
import { castLiuyao, DISCLAIMER, POS } from "@/lib/site/liuyao";

export const Route = createFileRoute("/liuyao")({
  head: () => ({ meta: [{ title: "六爻起卦 · 问道" }, { name: "description", content: "以钱代蓍模拟起卦，京房八宫纳甲装卦，列世应旺衰与依据。" }] }),
  component: LiuyaoPage,
});

type Result = ReturnType<typeof castLiuyao>;

function Bar({ yang, moving }: { yang: boolean; moving?: boolean }) {
  return <div className={`gua-bar ${moving ? "is-moving" : ""}`} aria-label={yang ? "阳爻" : "阴爻"}>{yang ? <span /> : <><span /><span /></>}</div>;
}

function LiuyaoPage() {
  const [q, setQ] = useState("");
  const [r, setR] = useState<Result | null>(null);
  const a = r?.analysis;
  return (
    <SiteShell active="六爻">
      <section className="mt-6">
        <p className="landing-kicker"><span aria-hidden="true" /> 以钱代蓍 · 京房八宫</p>
        <h1 className="mt-3 font-serif text-3xl">六爻起卦</h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">心中默念所问之事，一事一占。程序模拟三枚铜钱掷六次，自下而上成卦，并装上纳甲、六亲、六神与世应。</p>
      </section>
      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setR(castLiuyao(q));
        }}
      >
        <input className="wd-input" value={q} onChange={(e) => setQ(e.target.value)} maxLength={30} placeholder="所问之事（选填），如：近期换工作" aria-label="所问之事" />
        <button type="submit" className="wd-btn wd-btn-cin shrink-0">{r ? "再起一卦" : "起卦"}</button>
      </form>

      {r && a ? (
        <section className="mt-6 rounded-2xl border border-line bg-paper-3 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl">{a.name}{a.changed ? <span className="text-ink-soft"> 之 {a.changed.name}</span> : null}</h2>
            <span className="text-xs text-muted">{r.month}月 · {r.day}日 · 旬空{r.xunkong}</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">所问：{r.question || "未写所问"}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {a.palace}宫（{a.palaceEl}）{a.kind} · 世{POS[a.shi - 1]}爻 应{POS[a.ying - 1]}爻
            {a.changed ? ` · 动爻 ${r.moving.map((i) => POS[i] + "爻").join("、")} · 变卦${a.changed.palace}宫${a.changed.kind}` : " · 六爻安静"}
          </p>
          <div className="mt-4 space-y-1">
            {r.rows.map((y) => (
              <div key={y.pos} className="gua-row">
                <span className="text-muted">{y.pos}</span>
                <span className="text-muted">{y.shenShort}</span>
                <Bar yang={y.yang} moving={!!y.mark} />
                <span className="text-cinnabar">{y.mark}</span>
                <span className="tabular-nums">
                  {y.qin}{y.gan}{y.zhi}{y.el}
                  {y.shi ? <b className="ml-1 text-cinnabar">世</b> : y.ying ? <b className="ml-1 text-ink-soft">应</b> : null}
                  {y.change ? <span className="ml-1 text-ink-soft">→ {y.change.qin}{y.change.gan}{y.change.zhi}{y.change.el}</span> : null}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3 text-sm leading-7">
            <h3 className="font-serif text-base">世应旺衰</h3>
            {r.shiYing.map((s) => (
              <p key={s.tag}>
                {s.tag} {s.zhi}{s.el}：月{r.month[1]}{s.month}（{s.monthWord}），日{r.day[1]}{s.day}（{s.dayWord}）{s.kong ? "，旬空" : ""}
              </p>
            ))}
            {r.notes.map((n) => <p key={n} className="text-cinnabar">{n}</p>)}
          </div>
        </section>
      ) : null}

      <Basis items={r?.basis ?? castLiuyao("", { sums: [7, 7, 7, 7, 7, 7], now: 0 }).basis} />
      <Disclaimer>{DISCLAIMER} 程序随机模拟起卦，供了解传统占法之用。</Disclaimer>
    </SiteShell>
  );
}
