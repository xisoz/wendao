import { Link } from "@tanstack/react-router";

const ways = [
  {
    title: "新生儿",
    text: "记下姓氏和生辰。先看四柱缺哪一行，名字再把这一行补上。每个字写清寓意、依据和备注。",
  },
  {
    title: "公司",
    text: "字号要叫得出口。行业、五行、音律和字义放在一起看，不拿空话充字数。",
  },
] as const;

const method = [
  ["四柱", "年、月、日、时。时辰未定就标明未定，不拿一个假时辰凑数。"],
  ["缺补", "看四柱里哪一行偏弱。取名先补这一行，不靠一句笼统的吉凶。"],
  ["音律", "平仄和声调放在姓后面读一遍。拗口的组合会标出来。"],
  ["字义", "每个字都能回到字库：部首、康熙笔画、常用义。五格只作对照。"],
] as const;

const plates = [
  { src: "/culture/xishan.jpg", title: "溪山行旅", meta: "范宽 · 北宋", fit: "cover", text: "山要有骨。名字也一样，得站得住，不能只剩好听。" },
  { src: "/culture/tingqin.jpg", title: "听琴", meta: "传宋徽宗", fit: "cover", text: "琴声分清浊。名字要顺口，平仄错开，叫出来不打架。" },
  { src: "/app-icon.png", title: "一枚印", meta: "问道", fit: "contain", text: "首页和取名页用的是同一枚图。点进去，每个字的依据都写在纸上。" },
] as const;

export function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-5">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/app-icon.png" alt="" width={40} height={40} className="size-10 rounded-sm border border-line object-cover" />
          <span className="font-serif text-2xl leading-none">问道</span>
        </div>
        <Link to="/name" className="inline-flex min-h-11 items-center px-1 text-sm text-ink">
          取名
        </Link>
      </header>

      <figure className="mt-5 overflow-hidden rounded-lg border border-line">
        <img src="/culture/qianli.jpg" alt="北宋王希孟《千里江山图》局部，青绿山水与水榭长桥" className="h-56 w-full object-cover object-bottom sm:h-80" />
        <figcaption className="bg-paper-3 px-4 py-3 text-xs text-muted">王希孟《千里江山图》局部 · 北宋</figcaption>
      </figure>

      <section className="mt-8 max-w-2xl">
        <p className="text-sm text-cinnabar">生辰取名 · 公司起名</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">先看四柱，再衡字。</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          问道把生辰、五行缺补、音律和字义写在同一张纸上。名字从哪里来，为什么是这一个字，都可以回看。这是传统取名的参照，不是命运的结论。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/name" className="inline-flex min-h-11 items-center rounded-sm bg-ink px-5 text-sm text-paper-3">
            开始取名
          </Link>
          <a href="#way" className="inline-flex min-h-11 items-center rounded-sm border border-line bg-paper-3 px-5 text-sm text-ink">
            先看怎么取
          </a>
        </div>
      </section>

      <section id="way" className="mt-14 grid gap-3 sm:grid-cols-2">
        {ways.map((item) => (
          <article key={item.title} className="rounded-lg border border-line bg-paper-3 p-5">
            <h2 className="font-serif text-2xl">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.text}</p>
            <Link to="/name" className="mt-4 inline-flex min-h-11 items-center text-sm text-cinnabar">
              去取名
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-2xl">一张纸上的四件事</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {method.map(([title, text], i) => (
            <li key={title} className="rounded-lg border border-line bg-paper-3 p-5">
              <div className="text-xs text-muted">0{i + 1}</div>
              <h3 className="mt-2 font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl">从画里看取名</h2>
          <p className="text-xs text-muted">旧画，新用</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {plates.map((plate) => (
            <figure key={plate.title} className="overflow-hidden rounded-lg border border-line bg-paper-3">
              <img src={plate.src} alt="" className={plate.fit === "contain" ? "h-52 w-full bg-paper object-contain" : "h-52 w-full object-cover"} />
              <figcaption className="p-4">
                <div className="font-serif text-lg">{plate.title}</div>
                <div className="mt-1 text-xs text-muted">{plate.meta}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{plate.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-lg border border-line bg-paper-3 p-5 sm:p-8">
        <h2 className="font-serif text-2xl">五行只说缺和补</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          木生发，火光明，土承载，金决断，水润下。四柱里少了哪一行，名字就先补哪一行。不把命理说成定论。
        </p>
        <ul className="mt-5 flex flex-wrap gap-2 text-sm">
          <li className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-wood">木 · 生发</li>
          <li className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-fire">火 · 光明</li>
          <li className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-earth">土 · 承载</li>
          <li className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-metal">金 · 决断</li>
          <li className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-water">水 · 润下</li>
        </ul>
      </section>

      <footer className="mt-14 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        <p className="max-w-xl">问道用节气排八字，用缺补定五行，用平仄看音律，用康熙笔画看五格。画是古人的，名字是给现在的人用的。</p>
        <Link to="/name" className="inline-flex min-h-11 items-center text-sm text-ink">
          开始取名
        </Link>
      </footer>
    </main>
  );
}
