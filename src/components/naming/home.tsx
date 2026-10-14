import { Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/chrome";
import { Cover } from "@/components/site/article-bits";
import { fmtDate } from "@/lib/site/format";
import type { ArticleSummary } from "@/lib/site/articles-repo";

const criteria = [
  {
    number: "01",
    title: "先读起来",
    label: "音律",
    text: "声调有起伏，连着姓氏读一遍，不拗口，也不靠生僻字制造特别。",
  },
  {
    number: "02",
    title: "再说清楚",
    label: "字义",
    text: "每个字都有出处和常用义。好名字不是解释不通，而是越解释越有分寸。",
  },
  {
    number: "03",
    title: "放回场景里",
    label: "合适",
    text: "人名要陪人长大，字号要能被记住。气质、行业和使用场景要放在一起看。",
  },
] as const;

const examples = [
  {
    type: "人名示例",
    number: "示例 01",
    name: "林清和",
    pinyin: "Lín Qīnghé",
    meaning: "清正而有分寸，和而不弱。",
    note: "两个字放在一起，气质安静，叫起来也有开合。",
    tags: ["温润", "中性", "易读"],
    details: [
      ["读音", "2 · 1 · 2"],
      ["字义", "清正 · 和合"],
    ],
  },
  {
    type: "人名示例",
    number: "示例 02",
    name: "沈知衡",
    pinyin: "Shěn Zhīhéng",
    meaning: "知所进退，心有尺度。",
    note: "知与衡都不是夸张的字，组合起来却有清醒、稳当的方向。",
    tags: ["清醒", "稳重", "有出处"],
    details: [
      ["读音", "3 · 1 · 2"],
      ["字义", "知止 · 平衡"],
    ],
  },
  {
    type: "品牌示例",
    number: "示例 03",
    name: "见川",
    pinyin: "Jiàn Chuān",
    meaning: "见山见水，见事见人。",
    note: "适合文化、空间或内容品牌；短，清楚，有画面，也方便被记住。",
    tags: ["两字", "有画面", "品牌感"],
    details: [
      ["行业", "文化 · 空间"],
      ["气质", "开阔 · 克制"],
    ],
  },
  {
    type: "品牌示例",
    number: "示例 04",
    name: "长物集",
    pinyin: "Chángwù Jí",
    meaning: "把值得留下的东西，慢慢收在一起。",
    note: "有内容、有收藏感，适合生活方式、器物和出版类项目。",
    tags: ["有记忆点", "生活方式", "可延展"],
    details: [
      ["结构", "动词 + 名词"],
      ["气质", "温厚 · 有余地"],
    ],
  },
] as const;

const process = [
  ["01", "说清场景", "是给新生儿取名，还是给公司起字号？先把使用场景说清楚。"],
  ["02", "看四柱与缺补", "生辰完整就看四柱；时辰未定，也可以诚实地标明未定。"],
  ["03", "挑字、读名、回到字义", "把音律、五行、笔画和常用义放在一起比较，不只看一个分数。"],
  ["04", "留下依据", "最后留下为什么选它、为什么避开它，让名字以后还能被重新理解。"],
] as const;

export function Home({ articles = [] }: { articles?: ArticleSummary[] }) {
  return (
    <main className="landing-shell mx-auto min-h-screen max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <header className="landing-header flex items-center justify-between gap-4">
        <Link to="/" className="landing-brand inline-flex items-center gap-3" aria-label="返回问道首页">
          <span className="landing-mark" aria-hidden="true">问</span>
          <span>
            <span className="landing-brand-name block font-serif text-xl leading-none">问道</span>
            <span className="landing-brand-caption mt-1 block text-[10px] tracking-[0.2em] text-muted">NAME WITH REASON</span>
          </span>
        </Link>
        <SiteNav className="hidden sm:flex" />
        <Link to="/name" className="landing-header-cta inline-flex min-h-10 items-center rounded-full px-4 text-sm">
          开始取名 <span className="ml-2" aria-hidden="true">↗</span>
        </Link>
      </header>
      <SiteNav className="mt-3 sm:hidden" />

      <section className="landing-hero mt-5 overflow-hidden rounded-[1.75rem]">
        <div className="landing-hero-copy">
          <p className="landing-kicker"><span aria-hidden="true" /> 传统取名参考 · 人名与字号</p>
          <h1 className="landing-title mt-5 font-serif">好名字，<br /><em>要能被叫出来。</em></h1>
          <p className="landing-hero-text mt-5 max-w-lg">
            先听它的声音，再看它的意思，最后把它放回一个人的人生，或一家公司的日常里。问道把这些依据写在一起，让取名不只剩下一个好听的答案。
          </p>
          <div className="landing-hero-actions mt-7 flex flex-wrap gap-3">
            <Link to="/name" className="landing-primary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm">
              进入取名工作台 <span className="ml-3" aria-hidden="true">→</span>
            </Link>
            <a href="#examples" className="landing-ghost-button inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm">
              先看名字示例
            </a>
          </div>
          <div className="landing-hero-foot mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <span><b aria-hidden="true">01</b> 音律</span>
            <span><b aria-hidden="true">02</b> 字义</span>
            <span><b aria-hidden="true">03</b> 场景</span>
          </div>
        </div>

        <div className="landing-hero-demo">
          <div className="name-paper">
            <div className="name-paper-top">
              <span>名字练习 / 示例</span>
              <span>01</span>
            </div>
            <div className="name-paper-seal" aria-hidden="true">问</div>
            <div className="name-paper-name font-serif">清和</div>
            <div className="name-paper-pinyin">Qīng Hé · 清正 + 和合</div>
            <div className="name-paper-rule" />
            <div className="name-paper-grid">
              <div><span>读音</span><strong>平 · 平</strong></div>
              <div><span>气质</span><strong>温润 / 稳定</strong></div>
              <div><span>场景</span><strong>人名 / 中性</strong></div>
              <div><span>提醒</span><strong>示例，不是结论</strong></div>
            </div>
            <p className="name-paper-note">“清”让名字有明度，“和”让它有余地。合起来，读得顺，也留得住。</p>
          </div>
          <span className="hero-demo-caption">一个名字的依据，可以写得很清楚。</span>
        </div>
      </section>

      <section id="good-name" className="landing-section scroll-mt-8">
        <div className="landing-section-heading">
          <div>
            <p className="landing-kicker landing-kicker-light"><span aria-hidden="true" /> 先把判断标准讲清楚</p>
            <h2 className="landing-section-title mt-4 font-serif">好名字，不只是好听。</h2>
          </div>
          <p className="landing-section-intro">名字每天都会被叫、被写、被介绍。它要经得起这三种日常。</p>
        </div>
        <div className="criteria-grid mt-8 grid gap-3 md:grid-cols-3">
          {criteria.map((item) => (
            <article key={item.number} className="criteria-card rounded-2xl border border-line bg-paper-3 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="criteria-number">{item.number}</span>
                <span className="criteria-label">{item.label}</span>
              </div>
              <h3 className="mt-12 font-serif text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="examples" className="landing-section scroll-mt-8">
        <div className="landing-section-heading flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="landing-kicker"><span aria-hidden="true" /> 示例案 / Demo names</p>
            <h2 className="landing-section-title mt-4 font-serif">先看名字，再看依据。</h2>
          </div>
          <p className="landing-section-intro">下面的名字只用来展示判断方法，不替代你的姓氏、生辰和具体场景。</p>
        </div>
        <div className="examples-grid mt-8 grid gap-4 sm:grid-cols-2">
          {examples.map((example) => (
            <article key={example.name} className="example-card rounded-2xl border border-line bg-paper-3 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="example-type">{example.type}</span>
                <span className="text-muted">{example.number}</span>
              </div>
              <div className="mt-8 flex items-end justify-between gap-3">
                <div>
                  <h3 className="example-name font-serif">{example.name}</h3>
                  <p className="mt-1 text-xs tracking-[0.12em] text-muted">{example.pinyin}</p>
                </div>
                <span className="example-arrow" aria-hidden="true">↗</span>
              </div>
              <p className="mt-5 text-base leading-7 text-ink">{example.meaning}</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{example.note}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {example.tags.map((tag) => <span key={tag} className="example-tag">{tag}</span>)}
              </div>
              <dl className="example-details mt-6 grid grid-cols-2 gap-2 border-t border-line pt-4 text-xs">
                {example.details.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="mt-1 text-ink-soft">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-note-panel mt-20 rounded-[1.5rem] border border-line p-6 sm:p-9">
        <div className="landing-note-mark" aria-hidden="true">“</div>
        <div className="max-w-2xl">
          <p className="landing-kicker">问道的取舍</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">五行可以参考，但不替你下结论。</h2>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            生辰、五行、音律和笔画，都是整理思路的工具。真正要留下来的，还是一个名字的声音、字义，以及它和人的关系。我们把依据写出来，也把不确定的地方标出来。
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <div>
            <p className="landing-kicker"><span aria-hidden="true" /> 一张取名纸的顺序</p>
            <h2 className="landing-section-title mt-4 font-serif">从问题开始，到依据结束。</h2>
          </div>
        </div>
        <ol className="landing-process mt-8">
          {process.map(([number, title, text]) => (
            <li key={number} className="landing-process-item">
              <span className="landing-process-number">{number}</span>
              <div>
                <h3 className="font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {articles.length ? (
        <section id="articles" className="landing-section scroll-mt-8">
          <div className="landing-section-heading flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="landing-kicker"><span aria-hidden="true" /> 阅读 / Articles</p>
              <h2 className="landing-section-title mt-4 font-serif">先读懂，再取舍。</h2>
            </div>
            <Link to="/articles" className="text-sm text-cinnabar">全部文章 →</Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link to="/articles/$slug" params={{ slug: a.slug }} className="block rounded-2xl border border-line bg-paper-3 p-3 transition hover:border-ink">
                  <Cover src={a.cover} category={a.category} />
                  <p className="mt-3 text-xs text-muted">{a.pinned ? <span className="pin-badge mr-2">置顶</span> : null}{a.category} · {fmtDate(a.published_at)}</p>
                  <h3 className="mt-1 font-serif text-lg leading-snug">{a.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="landing-final-cta mt-20 flex flex-col gap-6 rounded-[1.5rem] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div>
          <p className="text-xs tracking-[0.18em] text-cinnabar-ink/70">轮到你的名字了</p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight text-paper-3 sm:text-4xl">带上姓氏、生辰或行业，开始认真取一个名字。</h2>
        </div>
        <Link to="/name" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-paper-3 px-6 text-sm text-ink">
          进入取名工作台 <span className="ml-3" aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className="landing-footer mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <span>问道 · Name with reason</span>
        <span>先听声音，再看字义。</span>
      </footer>
    </main>
  );
}
