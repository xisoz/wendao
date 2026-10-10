import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addElements, buildChart, elementState, HOURS, lackElements, validDate } from "@/lib/naming/bazi";
import { INDUSTRIES, STYLES, type StyleId } from "@/lib/naming/catalog";
import { generateBaby, generateCompany, type NameResult } from "@/lib/naming/generate";
import { lookupName, searchGlyphs } from "@/lib/naming/lexicon";
import { toneMark } from "@/lib/naming/pinyin";
import { loadSaved, writeSaved, type SavedName } from "@/lib/naming/storage";
import { parseSurname } from "@/lib/naming/surnames";
import type { Chart, El, Gender, NameIdea, Wuge } from "@/lib/naming/types";
import { cn } from "@/lib/utils";

type Tab = "name" | "chart" | "lex" | "saved";
type Mode = "baby" | "company";

const ELS: El[] = ["木", "火", "土", "金", "水"];
const EL_TEXT: Record<El, string> = {
  木: "text-wood",
  火: "text-fire",
  土: "text-earth",
  金: "text-metal",
  水: "text-water",
};

const YEARS: number[] = [];
for (let y = 2026; y >= 1940; y--) YEARS.push(y);

function Seal() {
  return (
    <img
      src="/app-icon.png"
      alt=""
      width={44}
      height={44}
      className="size-11 shrink-0 rounded-sm border border-line object-cover"
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const control = "h-11 w-full rounded-sm border border-line bg-paper-3 px-3 text-base text-ink";

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-3 text-sm transition-opacity duration-150",
        on ? "border-ink bg-ink text-paper-3" : "border-line bg-paper-3 text-ink",
      )}
    >
      {children}
    </button>
  );
}

function ElText({ el }: { el: string }) {
  return <span className={cn("font-medium", EL_TEXT[el as El] ?? "text-ink")}>{el}</span>;
}

function Pillars({ chart }: { chart: Chart }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {chart.pillars.map((p) => (
        <div key={p.label} className="rounded-md border border-line bg-paper px-1 py-3 text-center">
          <div className="text-xs text-muted">{p.label}柱</div>
          {p.known ? (
            <>
              <div className="mt-2 font-serif text-2xl leading-none">{p.gan}</div>
              <div className="mt-1 text-xs">
                <ElText el={p.ganEl} /> · {p.shiGan}
              </div>
              <div className="mt-3 font-serif text-2xl leading-none">{p.zhi}</div>
              <div className="mt-1 text-xs">
                <ElText el={p.zhiEl} />
              </div>
              <div className="mt-2 text-xs leading-snug text-muted">{p.hide.join(" ")}</div>
              <div className="mt-2 text-xs text-ink-soft">{p.nayin}</div>
            </>
          ) : (
            <div className="mt-8 text-sm text-muted">未定</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Bars({ chart }: { chart: Chart }) {
  const max = Math.max(...ELS.map((e) => chart.counts[e]), 0.1);
  return (
    <div className="space-y-2">
      {ELS.map((el) => (
        <div key={el} className="grid grid-cols-[2rem_1fr_4.75rem] items-center gap-2 text-sm">
          <ElText el={el} />
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div
              className={cn("h-full", {
                "bg-wood": el === "木",
                "bg-fire": el === "火",
                "bg-earth": el === "土",
                "bg-metal": el === "金",
                "bg-water": el === "水",
              })}
              style={{ width: `${Math.round((chart.counts[el] / max) * 100)}%` }}
            />
          </div>
          <span className="text-right text-xs tabular-nums">
            <span className={elementState(chart.counts[el]) === "缺" ? "text-cinnabar" : "text-ink-soft"}>
              {elementState(chart.counts[el])}
            </span>
            <span className="ml-1 text-muted">{chart.counts[el].toFixed(1)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function WugeTable({ wuge }: { wuge: Wuge }) {
  const cells = [wuge.tian, wuge.ren, wuge.di, wuge.wai, wuge.zong];
  return (
    <div>
      <div className="grid grid-cols-5 gap-1 text-center">
        {cells.map((c) => (
          <div key={c.key} className="rounded-sm bg-paper px-1 py-2">
            <div className="text-xs text-muted">{c.key}</div>
            <div className="mt-1 font-serif text-lg tabular-nums">{c.reduced}</div>
            <div className="text-xs text-ink-soft">{c.level}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        三才 {wuge.sancai} · {wuge.sancaiNote}
      </p>
    </div>
  );
}

function NameCard({
  idea,
  open,
  saved,
  onOpen,
  onSave,
}: {
  idea: NameIdea;
  open: boolean;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  return (
    <article className="rounded-xl border border-line bg-paper-3 p-5">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-3xl tracking-wide">{idea.full}</h3>
            <p className="mt-1 text-sm text-muted">{idea.pinyin}</p>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl tabular-nums text-cinnabar">{idea.score}</div>
            <div className="text-xs text-muted">衡分</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {idea.chars.map((c) => (
            <span key={c.c} className="text-ink-soft">
              {c.c} <ElText el={c.el} />
            </span>
          ))}
          <span className="text-muted">{idea.pattern}</span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {idea.fills.length ? `补${idea.fills.join("、")}` : "五行作参照"}
          <span className="text-muted"> · 点开看字义与笔画</span>
        </p>
      </button>
      <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
        <div>
          <div className="text-xs tracking-wide text-muted">寓意</div>
          <p className="mt-1 leading-relaxed text-ink">{idea.meaning}</p>
        </div>
        <div>
          <div className="text-xs tracking-wide text-muted">依据</div>
          <ul className="mt-1 space-y-1.5 leading-relaxed text-ink-soft">
            {idea.basis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="leading-relaxed text-ink-soft">
          <span className="text-muted">备注 </span>
          {idea.note}
        </p>
      </div>
      {open ? (
        <div className="rise mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <ul className="space-y-2">
            {idea.chars.map((c) => (
              <li key={c.c}>
                <span className="font-serif text-lg">{c.c}</span>
                <span className="ml-2 text-muted">{toneMark(c.py, c.tone)}</span>
                <span className="ml-2">
                  <ElText el={c.el} />
                </span>
                <span className="ml-2 text-muted">
                  {c.rad}部 · 康熙 {c.st} 画{c.trad !== c.c ? ` · 繁体 ${c.trad}` : ""}
                </span>
                <span className="mt-0.5 block text-ink-soft">{c.gloss}</span>
              </li>
            ))}
          </ul>
          {idea.wuge ? <WugeTable wuge={idea.wuge} /> : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 flex-1 rounded-sm border border-line bg-paper text-ink"
              onClick={onSave}
            >
              {saved ? "已在名册" : "收下"}
            </button>
            <button
              type="button"
              className="min-h-11 flex-1 rounded-sm border border-line bg-paper text-ink"
              onClick={() => {
                void navigator.clipboard?.writeText(idea.full);
              }}
            >
              复制
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function BirthFields({
  year, month, day, hour, gender,
  setYear, setMonth, setDay, setHour, setGender,
}: {
  year: string; month: string; day: string; hour: string; gender: Gender;
  setYear: (v: string) => void;
  setMonth: (v: string) => void;
  setDay: (v: string) => void;
  setHour: (v: string) => void;
  setGender: (v: Gender) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Chip on={gender === "m"} onClick={() => setGender("m")}>男</Chip>
        <Chip on={gender === "f"} onClick={() => setGender("f")}>女</Chip>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select className={control} value={year} onChange={(e) => setYear(e.target.value)} aria-label="年">
          <option value="">年</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className={control} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="月">
          <option value="">月</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m} 月</option>
          ))}
        </select>
        <select className={control} value={day} onChange={(e) => setDay(e.target.value)} aria-label="日">
          <option value="">日</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d} 日</option>
          ))}
        </select>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-ink-soft">时辰</div>
        <div className="grid grid-cols-4 gap-2">
          {HOURS.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={hour === h.id}
              onClick={() => setHour(h.id)}
              className={cn(
                "min-h-11 rounded-sm border px-1 text-sm",
                hour === h.id ? "border-ink bg-ink text-paper-3" : "border-line bg-paper-3 text-ink",
              )}
            >
              <span className="block font-serif">{h.name}</span>
              <span className="block text-xs opacity-80">{h.range}</span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={hour === ""}
            onClick={() => setHour("")}
            className={cn(
              "min-h-11 rounded-sm border px-1 text-sm",
              hour === "" ? "border-ink bg-ink text-paper-3" : "border-line bg-paper-3 text-ink",
            )}
          >
            未知
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">夜里 23 点到 24 点，日期选次日，时辰选子。排盘以节气换年月，不以正月初一。</p>
      </div>
    </div>
  );
}

function ElPicker({ value, onChange }: { value: El[] | null; onChange: (v: El[] | null) => void }) {
  const selected = value ?? [];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft">指定五行</span>
        <button type="button" className="text-sm text-cinnabar" onClick={() => onChange(null)}>
          按喜用
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ELS.map((el) => (
          <Chip
            key={el}
            on={selected.includes(el)}
            onClick={() => {
              const has = selected.includes(el);
              const next = has ? selected.filter((x) => x !== el) : [...selected, el];
              onChange(next.length ? next : null);
            }}
          >
            {el}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{value ? "已改用手选五行，不再按所缺来补。" : "不选则补四柱和姓里偏缺的五行。"}</p>
    </div>
  );
}

function ChartRead({ chart }: { chart: Chart }) {
  return (
    <div className="space-y-4">
      <Pillars chart={chart} />
      <p className="text-sm text-muted">
        农历 {chart.lunar} · 生肖 {chart.zodiac} · {chart.dayGan}{chart.dayEl} · {chart.strength}
      </p>
      <Bars chart={chart} />
      <p className="text-sm leading-relaxed text-ink-soft">{chart.summary}</p>
      <p className="text-sm leading-relaxed text-ink-soft">{chart.yongText}</p>
      <div>
        <h3 className="font-serif text-lg">运势</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{chart.startText}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{chart.yearText}</p>
      </div>
      {chart.daYun.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chart.daYun.map((d) => {
            const on = chart.currentYun?.ganZhi === d.ganZhi && chart.currentYun.startYear === d.startYear;
            return (
              <div
                key={`${d.ganZhi}-${d.startYear}`}
                className={cn(
                  "min-w-24 shrink-0 rounded-md border px-3 py-2 text-sm",
                  on ? "border-cinnabar bg-paper" : "border-line bg-paper",
                )}
              >
                <div className="font-serif text-lg">{d.ganZhi}</div>
                <div className="text-xs tabular-nums text-muted">
                  {d.startYear}–{d.endYear}
                </div>
                <div className="text-xs text-muted">{d.startAge} 岁起</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Studio() {
  const [tab, setTab] = useState<Tab>("name");
  const [mode, setMode] = useState<Mode>("baby");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState<Gender>("f");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("10");
  const [givenLen, setGivenLen] = useState<1 | 2>(2);
  const [style, setStyle] = useState<StyleId>("清雅");
  const [generation, setGeneration] = useState("");
  const [generationPos, setGenerationPos] = useState<"front" | "back">("front");
  const [avoid, setAvoid] = useState("");
  const [preferred, setPreferred] = useState<El[] | null>(null);
  const [babyOut, setBabyOut] = useState<NameResult | null>(null);

  const [industryId, setIndustryId] = useState("tech");
  const [brandLen, setBrandLen] = useState<2 | 3>(2);
  const [brandStyle, setBrandStyle] = useState<StyleId>("大气");
  const [brandAvoid, setBrandAvoid] = useState("");
  const [include, setInclude] = useState("");
  const [withSuffix, setWithSuffix] = useState(false);
  const [useFounder, setUseFounder] = useState(false);
  const [fYear, setFYear] = useState("");
  const [fMonth, setFMonth] = useState("");
  const [fDay, setFDay] = useState("");
  const [fHour, setFHour] = useState("");
  const [fGender, setFGender] = useState<Gender>("m");
  const [brandPref, setBrandPref] = useState<El[] | null>(null);
  const [brandOut, setBrandOut] = useState<NameResult | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedName[]>([]);
  const [query, setQuery] = useState("");
  const [lexEl, setLexEl] = useState<El | "全部">("全部");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  useEffect(() => {
    if (!babyOut?.ideas.length && !brandOut?.ideas.length) return;
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [babyOut, brandOut]);

  const surnameInfo = useMemo(() => {
    const parsed = parseSurname(surname);
    return "error" in parsed ? null : parsed;
  }, [surname]);

  const birthReady = validDate(Number(year), Number(month), Number(day));
  const liveChart = useMemo(() => {
    if (!birthReady) return null;
    return buildChart({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: hour === "" ? null : Number(hour),
      gender,
    });
  }, [birthReady, year, month, day, hour, gender]);
  const combinedLack = useMemo(() => {
    if (!liveChart) return [] as El[];
    if (!surnameInfo) return liveChart.lack;
    return lackElements(addElements(liveChart.counts, surnameInfo.els));
  }, [liveChart, surnameInfo]);

  function remember(idea: NameIdea) {
    setSaved((prev) => {
      if (prev.some((s) => s.full === idea.full && s.kind === idea.kind)) return prev;
      const next: SavedName[] = [
        {
          id: `${idea.kind}-${idea.full}`,
          full: idea.full,
          pinyin: idea.pinyin,
          score: idea.score,
          kind: idea.kind,
          note: idea.reasons[0] ?? "",
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 40);
      writeSaved(next);
      return next;
    });
  }

  function forget(id: string) {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeSaved(next);
      return next;
    });
  }

  function runBaby(batch = 0) {
    const out = generateBaby({
      surname,
      gender,
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: hour === "" ? null : Number(hour),
      givenLen,
      style,
      generation,
      generationPos,
      avoid,
      preferred,
      batch,
    });
    setBabyOut(out);
    setOpenId(out.ideas[0]?.id ?? null);
  }

  function runCompany(batch = 0) {
    const founderReady = useFounder && validDate(Number(fYear), Number(fMonth), Number(fDay));
    const out = generateCompany({
      industryId,
      len: brandLen,
      style: brandStyle,
      avoid: brandAvoid,
      withSuffix,
      include,
      preferred: brandPref,
      batch,
      founder: founderReady
        ? {
            year: Number(fYear),
            month: Number(fMonth),
            day: Number(fDay),
            hour: fHour === "" ? null : Number(fHour),
            gender: fGender,
          }
        : null,
    });
    setBrandOut(out);
    setOpenId(out.ideas[0]?.id ?? null);
  }

  function fillSample() {
    setMode("baby");
    setSurname("林");
    setGender("f");
    setYear("2024");
    setMonth("4");
    setDay("12");
    setHour("10");
    setGivenLen(2);
    setStyle("清雅");
    setGeneration("");
    setAvoid("");
    setPreferred(null);
  }

  const ideas = mode === "baby" ? babyOut?.ideas ?? [] : brandOut?.ideas ?? [];
  const activeOut = mode === "baby" ? babyOut : brandOut;
  const lex = useMemo(() => searchGlyphs(query, lexEl), [query, lexEl]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-6">
      <header className="flex items-start gap-3">
        <Seal />
        <div>
          <h1 className="font-serif text-3xl leading-none tracking-tight">问道</h1>
          <p className="mt-2 text-sm text-ink-soft">生辰取名 · 公司起名</p>
        </div>
      </header>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
        先看四柱，再衡字。喜用、音律、字义与《康熙字典》笔画放在同一张纸上。这是传统取名的参照，不是命运的结论。
      </p>

      <nav className="mt-5 grid grid-cols-4 gap-1 rounded-lg bg-paper-2 p-1" aria-label="分栏">
        {(
          [
            ["name", "取名"],
            ["chart", "八字"],
            ["lex", "字库"],
            ["saved", "名册"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "min-h-11 rounded-md text-sm",
              tab === id ? "bg-paper-3 text-ink" : "text-ink-soft",
            )}
          >
            {label}
            {id === "saved" && saved.length ? <span className="ml-1 tabular-nums text-muted">{saved.length}</span> : null}
          </button>
        ))}
      </nav>

      {tab === "name" ? (
        <section className="mt-5 space-y-4">
          <div className="flex gap-2">
            <Chip on={mode === "baby"} onClick={() => setMode("baby")}>新生儿</Chip>
            <Chip on={mode === "company"} onClick={() => setMode("company")}>公司</Chip>
            <button type="button" className="min-h-11 px-2 text-sm text-muted" onClick={fillSample}>
              填一个例子
            </button>
          </div>

          {mode === "baby" ? (
            <div className="space-y-5 rounded-xl border border-line bg-paper-3 p-5">
              <Field label="姓">
                <input className={control} value={surname} maxLength={2} placeholder="林，或欧阳" onChange={(e) => setSurname(e.target.value)} />
              </Field>
              <BirthFields
                year={year} month={month} day={day} hour={hour} gender={gender}
                setYear={setYear} setMonth={setMonth} setDay={setDay} setHour={setHour} setGender={setGender}
              />
              {liveChart ? (
                <p className="text-sm leading-relaxed text-ink-soft">
                  {liveChart.pillars.filter((p) => p.known).map((p) => `${p.gan}${p.zhi}`).join(" ")} · {liveChart.strength}
                  {" · "}
                  四柱{liveChart.lack.length ? `缺${liveChart.lack.join("、")}` : "无明显所缺"}
                  {surnameInfo ? ` · 姓属${surnameInfo.els.join("、") || "未入字库"}` : ""}
                  {surnameInfo
                    ? combinedLack.length
                      ? ` · 合起来宜补${combinedLack.join("、")}`
                      : " · 合起来五行比较齐"
                    : ""}
                </p>
              ) : null}
              <div>
                <div className="mb-2 text-sm font-medium text-ink-soft">名字字数</div>
                <div className="flex gap-2">
                  <Chip on={givenLen === 2} onClick={() => setGivenLen(2)}>双字</Chip>
                  <Chip on={givenLen === 1} onClick={() => setGivenLen(1)}>单字</Chip>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-ink-soft">气质</div>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <Chip key={s} on={style === s} onClick={() => setStyle(s)}>{s}</Chip>
                  ))}
                </div>
              </div>
              <ElPicker value={preferred} onChange={setPreferred} />
              {givenLen === 2 ? (
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Field label="辈分字，可空">
                    <input className={control} value={generation} maxLength={1} onChange={(e) => setGeneration(e.target.value)} />
                  </Field>
                  <div>
                    <div className="mb-2 text-sm font-medium text-ink-soft">位置</div>
                    <div className="flex gap-2">
                      <Chip on={generationPos === "front"} onClick={() => setGenerationPos("front")}>前</Chip>
                      <Chip on={generationPos === "back"} onClick={() => setGenerationPos("back")}>后</Chip>
                    </div>
                  </div>
                </div>
              ) : null}
              <Field label="避开的字">
                <input className={control} value={avoid} placeholder="不必多，写要躲开的" onChange={(e) => setAvoid(e.target.value)} />
              </Field>
              <button type="button" onClick={() => runBaby()} className="sticky bottom-3 z-10 h-12 w-full rounded-sm bg-cinnabar text-base font-medium text-cinnabar-ink shadow-sm">
                衡名
              </button>
            </div>
          ) : (
            <div className="space-y-5 rounded-xl border border-line bg-paper-3 p-5">
              <Field label="行业">
                <select className={control} value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                  {INDUSTRIES.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </Field>
              <p className="text-sm text-ink-soft">{INDUSTRIES.find((i) => i.id === industryId)?.note}</p>
              <div>
                <div className="mb-2 text-sm font-medium text-ink-soft">字号长短</div>
                <div className="flex gap-2">
                  <Chip on={brandLen === 2} onClick={() => setBrandLen(2)}>两字</Chip>
                  <Chip on={brandLen === 3} onClick={() => setBrandLen(3)}>三字</Chip>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-ink-soft">气质</div>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <Chip key={s} on={brandStyle === s} onClick={() => setBrandStyle(s)}>{s}</Chip>
                  ))}
                </div>
              </div>
              <ElPicker value={brandPref} onChange={setBrandPref} />
              <Field label="想用的一个字，可空">
                <input className={control} value={include} maxLength={1} onChange={(e) => setInclude(e.target.value)} />
              </Field>
              <Field label="避开的字">
                <input className={control} value={brandAvoid} onChange={(e) => setBrandAvoid(e.target.value)} />
              </Field>
              <Chip on={withSuffix} onClick={() => setWithSuffix((v) => !v)}>附行业词</Chip>
              <Chip on={useFounder} onClick={() => setUseFounder((v) => !v)}>按创办人生辰</Chip>
              {useFounder ? (
                <BirthFields
                  year={fYear} month={fMonth} day={fDay} hour={fHour} gender={fGender}
                  setYear={setFYear} setMonth={setFMonth} setDay={setFDay} setHour={setFHour} setGender={setFGender}
                />
              ) : null}
              <button type="button" onClick={() => runCompany()} className="sticky bottom-3 z-10 h-12 w-full rounded-sm bg-cinnabar text-base font-medium text-cinnabar-ink shadow-sm">
                衡字号
              </button>
            </div>
          )}

          {activeOut?.error ? <p className="text-sm text-cinnabar">{activeOut.error}</p> : null}
          {activeOut?.diagnosis ? (
            <div className="rounded-xl border border-line bg-paper-3 p-5">
              <h2 className="font-serif text-xl">五行所缺</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{activeOut.diagnosis}</p>
            </div>
          ) : null}
          {activeOut?.note ? <p className="text-sm text-muted">{activeOut.note}</p> : null}
          <div ref={listRef} className="space-y-3">
            {ideas.map((idea) => (
              <NameCard
                key={idea.id}
                idea={idea}
                open={openId === idea.id}
                saved={saved.some((s) => s.full === idea.full && s.kind === idea.kind)}
                onOpen={() => setOpenId((id) => (id === idea.id ? null : idea.id))}
                onSave={() => remember(idea)}
              />
            ))}
          </div>
          {activeOut && activeOut.pages > 1 ? (
            <button
              type="button"
              className="h-12 w-full rounded-sm border border-line bg-paper-3 text-ink"
              onClick={() => (mode === "baby" ? runBaby(activeOut.page + 1) : runCompany(activeOut.page + 1))}
            >
              再衡一批
              <span className="ml-2 tabular-nums text-muted">
                {activeOut.page + 1}/{activeOut.pages}
              </span>
            </button>
          ) : null}
          {activeOut?.chart && mode === "baby" ? (
            <div className="rounded-xl border border-line bg-paper-3 p-5">
              <h2 className="font-serif text-xl">这张盘</h2>
              <div className="mt-3">
                <ChartRead chart={activeOut.chart} />
              </div>
            </div>
          ) : null}
          {activeOut?.chart && mode === "company" ? (
            <div className="rounded-xl border border-line bg-paper-3 p-5">
              <h2 className="font-serif text-xl">创办人</h2>
              <div className="mt-3">
                <ChartRead chart={activeOut.chart} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "chart" ? (
        <section className="mt-5 space-y-4 rounded-xl border border-line bg-paper-3 p-5">
          <h2 className="font-serif text-xl">看八字</h2>
          <BirthFields
            year={year} month={month} day={day} hour={hour} gender={gender}
            setYear={setYear} setMonth={setMonth} setDay={setDay} setHour={setHour} setGender={setGender}
          />
          {liveChart ? <ChartRead chart={liveChart} /> : <p className="text-sm text-muted">选好年月日，四柱会在这里排开。</p>}
          <button
            type="button"
            className="h-12 w-full rounded-sm bg-cinnabar font-medium text-cinnabar-ink"
            onClick={() => {
              setMode("baby");
              setTab("name");
            }}
          >
            用这张盘取名
          </button>
        </section>
      ) : null}

      {tab === "lex" ? (
        <section className="mt-5 space-y-4">
          <Field label="查字">
            <input
              className={control}
              value={query}
              placeholder="一个字，或拼音"
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Chip on={lexEl === "全部"} onClick={() => setLexEl("全部")}>全部</Chip>
            {ELS.map((el) => (
              <Chip key={el} on={lexEl === el} onClick={() => setLexEl(el)}>{el}</Chip>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            笔画按《康熙字典》繁体口径，氵作水、艹作艸，所以常和简体手写笔画不同。五行是取名用的传统归类，不是字义本身。
          </p>
          <ul className="space-y-2">
            {lex.map((g) => {
              const named = lookupName(g.c);
              return (
                <li key={g.c} className="rounded-lg border border-line bg-paper-3 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-2xl">{g.c}</span>
                    <span className="text-sm text-muted">{toneMark(g.py, g.tone)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    <ElText el={g.el} /> · {g.rad || "—"}部 · 康熙 {g.st} 画
                    {g.trad !== g.c ? ` · 繁体 ${g.trad}` : ""}
                  </p>
                  {named ? <p className="mt-1 text-sm text-ink-soft">{named.gloss}</p> : null}
                </li>
              );
            })}
          </ul>
          {!query && lexEl === "全部" ? (
            <p className="text-sm text-muted">先输入要查的字。不输入时，只露出这一行五行里的前一批。</p>
          ) : null}
        </section>
      ) : null}

      {tab === "saved" ? (
        <section className="mt-5 space-y-3">
          {saved.length === 0 ? (
            <p className="rounded-xl border border-line bg-paper-3 p-5 text-sm text-ink-soft">
              名册还空着。在名字上点「收下」，记在这台设备里，不上传。
            </p>
          ) : (
            saved.map((s) => (
              <article key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-paper-3 p-5">
                <div>
                  <h3 className="font-serif text-2xl">{s.full}</h3>
                  <p className="mt-1 text-sm text-muted">{s.pinyin}</p>
                  <p className="mt-1 text-sm text-ink-soft">{s.kind === "baby" ? "人名" : "字号"} · {s.note}</p>
                </div>
                <button type="button" className="min-h-11 shrink-0 text-sm text-muted" onClick={() => forget(s.id)}>
                  移除
                </button>
              </article>
            ))
          )}
        </section>
      ) : null}

      <details className="mt-8 rounded-xl border border-line bg-paper-3 p-5 text-sm">
        <summary className="min-h-11 cursor-pointer font-medium text-ink">放到桌面</summary>
        <div className="mt-3 space-y-2 leading-relaxed text-ink-soft">
          <p>用 Chrome 打开本页，点右上角菜单，选「安装」。装上之后名字是问道，图标是这张图。</p>
          <p>苹果手机点底部分享，再点「添加到主屏幕」。</p>
        </div>
      </details>

      <footer className="mt-10 text-xs leading-relaxed text-muted">
        问道用节气排八字，用喜用神定五行，用平仄看音律，用康熙笔画算五格。五格数理是姓名学传统，和八字不是同一套学问，两列对照即可，不必强行合成一个分数。
      </footer>
    </main>
  );
}
