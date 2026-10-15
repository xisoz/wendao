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

const knowledgeTopics = [
  {
    category: "八字",
    index: "01",
    title: "先读懂四柱",
    text: "从节气、干支到时辰，先把排盘的时间口径说清楚。",
  },
  {
    category: "取名",
    index: "02",
    title: "名字怎么取舍",
    text: "音律、字义和使用场景，应该一起看，而不是只看一个分数。",
  },
  {
    category: "六爻",
    index: "03",
    title: "术数的边界",
    text: "了解传统方法怎样推演，也把能确定与不能确定的部分分开。",
  },
  {
    category: "民俗",
    index: "04",
    title: "把习俗放回日常",
    text: "黄历、节气与民间习惯，先知道它从哪里来，再决定怎么用。",
  },
] as const;

type HomeArticle = Pick<
  ArticleSummary,
  "id" | "slug" | "title" | "summary" | "cover" | "category" | "pinned" | "published_at"
>;

// 数据服务暂时不可用时，首页仍保留可读的知识入口；正式文章列表返回后会自动以最新内容为准。
const starterArticles: HomeArticle[] = [
  {
    id: -1,
    slug: "bazi-basics",
    title: "八字入门：四柱、天干与地支",
    summary: "八字由年、月、日、时四柱组成。先弄清它们从哪里来，才读得懂一张命盘。",
    cover: null,
    category: "八字",
    pinned: true,
    published_at: "2026-10-14T01:28:09.236Z",
  },
  {
    id: -2,
    slug: "wuxing",
    title: "五行生克与喜用神",
    summary: "“五行缺”与“喜用神”各指什么，又为什么不必见缺就补。",
    cover: null,
    category: "八字",
    pinned: false,
    published_at: "2026-10-14T00:28:09.236Z",
  },
  {
    id: -3,
    slug: "naming",
    title: "传统取名：字义、音律与笔画",
    summary: "一个好名字要经得起看、读、写；这些判断依据应该怎样放在一起看。",
    cover: null,
    category: "取名",
    pinned: false,
    published_at: "2026-10-13T01:28:09.236Z",
  },
  {
    id: -4,
    slug: "huangli",
    title: "黄历宜忌怎么看",
    summary: "建除十二值、黄道黑道、冲煞各是什么意思，又应该怎样看待。",
    cover: null,
    category: "民俗",
    pinned: false,
    published_at: "2026-10-12T01:28:09.236Z",
  },
];

export function Home({ articles = [] }: { articles?: ArticleSummary[] }) {
  const homeArticles: HomeArticle[] = articles.length ? articles : starterArticles;
  const featured = homeArticles.find((article) => article.pinned) ?? homeArticles[0];
  const latestArticles = featured
    ? homeArticles.filter((article) => article.id !== featured.id).slice(0, 3)
    : [];

  return (
    <main className="landing-shell mx-auto min-h-screen max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <header className="landing-header flex items-center justify-between gap-4">
        <Link
          to="/"
          className="landing-brand inline-flex items-center gap-3"
          aria-label="返回问道首页"
        >
          <span className="landing-mark" aria-hidden="true">
            问
          </span>
          <span>
            <span className="landing-brand-name block font-serif text-xl leading-none">问道</span>
            <span className="landing-brand-caption mt-1 block text-[10px] tracking-[0.2em] text-muted">
              取名有据
            </span>
          </span>
        </Link>
        <SiteNav className="hidden sm:flex" />
        <Link
          to="/name"
          className="landing-header-cta inline-flex min-h-10 items-center rounded-full px-4 text-sm"
        >
          取名工具{" "}
          <span className="ml-2" aria-hidden="true">
            ↗
          </span>
        </Link>
      </header>
      <SiteNav className="mt-3 sm:hidden" />

      <section className="knowledge-home-hero mt-5 overflow-hidden rounded-[1.75rem]">
        <div className="knowledge-home-copy">
          <p className="landing-kicker">
            <span aria-hidden="true" /> 问道知识库 · 八字、取名与传统文化
          </p>
          <h1 className="knowledge-home-title mt-5 font-serif">
            先把传统知识，
            <br />
            <em>讲得明白。</em>
          </h1>
          <p className="knowledge-home-text mt-5 max-w-xl">
            从八字、五行到取名和日常民俗，先读懂概念、方法与边界。需要取名时，再带着清楚的问题进入工作台，而不是只追一个看起来很高的分数。
          </p>
          <div className="knowledge-home-actions mt-7 flex flex-wrap gap-3">
            <Link
              to="/articles"
              className="knowledge-home-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
            >
              从文章开始{" "}
              <span className="ml-3" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              to="/name"
              className="knowledge-home-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm"
            >
              有了问题，再去取名
            </Link>
          </div>
          <div className="knowledge-home-index mt-9 grid grid-cols-2 gap-x-5 gap-y-3 text-xs sm:grid-cols-4">
            <span>八字 <b>四柱与节气</b></span>
            <span>取名 <b>音律与字义</b></span>
            <span>六爻 <b>方法与边界</b></span>
            <span>民俗 <b>黄历与日常</b></span>
          </div>
        </div>

        {featured ? (
          <Link
            to="/articles/$slug"
            params={{ slug: featured.slug }}
            className="knowledge-feature-card"
          >
            <div className="knowledge-feature-cover">
              <Cover src={featured.cover} category={featured.category} seed={featured.slug} />
            </div>
            <div className="knowledge-feature-copy">
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span className="knowledge-feature-label">今日先读</span>
                <span>{featured.published_at ? fmtDate(featured.published_at) : "知识文章"}</span>
              </div>
              <p className="mt-5 text-xs text-cinnabar">{featured.category}</p>
              <h2 className="mt-2 font-serif text-2xl leading-snug sm:text-3xl">{featured.title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{featured.summary}</p>
              <span className="knowledge-feature-read mt-6 inline-flex items-center text-sm">
                阅读这篇文章 <b className="ml-2" aria-hidden="true">→</b>
              </span>
            </div>
          </Link>
        ) : (
          <Link to="/articles" className="knowledge-feature-card knowledge-feature-empty">
            <div className="knowledge-feature-empty-mark font-serif" aria-hidden="true">读</div>
            <div className="knowledge-feature-copy">
              <p className="knowledge-feature-label">知识从这里开始</p>
              <h2 className="mt-5 font-serif text-2xl leading-snug sm:text-3xl">把问题拆开，再慢慢读。</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">文章库正在整理八字、取名、民俗与传统术数的基础知识。</p>
              <span className="knowledge-feature-read mt-6 inline-flex items-center text-sm">查看文章 <b className="ml-2" aria-hidden="true">→</b></span>
            </div>
          </Link>
        )}
      </section>

      <section id="articles" className="knowledge-home-library scroll-mt-8">
        <div className="knowledge-home-library-heading">
          <div>
            <p className="landing-kicker"><span aria-hidden="true" /> 知识导航</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">从一个问题开始读。</h2>
          </div>
          <Link to="/articles" className="knowledge-library-link text-sm">查看全部文章 <span aria-hidden="true">→</span></Link>
        </div>
        <div className="knowledge-topic-grid mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {knowledgeTopics.map((topic) => (
            <Link
              key={topic.category}
              to="/articles"
              search={{ cat: topic.category }}
              className="knowledge-topic-card rounded-2xl border border-line p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="knowledge-topic-index">{topic.index}</span>
                <span className="knowledge-topic-category">{topic.category}</span>
              </div>
              <h3 className="mt-9 font-serif text-xl">{topic.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{topic.text}</p>
              <span className="mt-5 inline-flex text-sm text-cinnabar">阅读文章 <b className="ml-2" aria-hidden="true">→</b></span>
            </Link>
          ))}
        </div>

        {latestArticles.length ? (
          <div className="knowledge-latest-grid mt-5 grid gap-4 sm:grid-cols-3">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                className="knowledge-latest-card rounded-2xl border border-line bg-paper-3 p-3"
              >
                <Cover src={article.cover} category={article.category} seed={article.slug} />
                <div className="px-1 pb-1 pt-3">
                  <p className="text-xs text-muted">{article.category} · {fmtDate(article.published_at)}</p>
                  <h3 className="mt-2 font-serif text-lg leading-snug">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section id="good-name" className="landing-section scroll-mt-8">
        <div className="landing-section-heading">
          <div>
            <p className="landing-kicker landing-kicker-light">
              <span aria-hidden="true" /> 先把判断标准讲清楚
            </p>
            <h2 className="landing-section-title mt-4 font-serif">好名字，不只是好听。</h2>
          </div>
          <p className="landing-section-intro">
            名字每天都会被叫、被写、被介绍。它要经得起这三种日常。
          </p>
        </div>
        <div className="criteria-grid mt-8 grid gap-3 md:grid-cols-3">
          {criteria.map((item) => (
            <article
              key={item.number}
              className="criteria-card rounded-2xl border border-line bg-paper-3 p-5 sm:p-6"
            >
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
            <p className="landing-kicker">
              <span aria-hidden="true" /> 名字示例 · 判断依据
            </p>
            <h2 className="landing-section-title mt-4 font-serif">先看名字，再看依据。</h2>
          </div>
          <p className="landing-section-intro">
            下面的名字只用来展示判断方法，不替代你的姓氏、生辰和具体场景。
          </p>
        </div>
        <div className="examples-grid mt-8 grid gap-4 sm:grid-cols-2">
          {examples.map((example) => (
            <article
              key={example.name}
              className="example-card rounded-2xl border border-line bg-paper-3 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="example-type">{example.type}</span>
                <span className="text-muted">{example.number}</span>
              </div>
              <div className="mt-8 flex items-end justify-between gap-3">
                <div>
                  <h3 className="example-name font-serif">{example.name}</h3>
                  <p className="mt-1 text-xs tracking-[0.12em] text-muted">{example.pinyin}</p>
                </div>
                <span className="example-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <p className="mt-5 text-base leading-7 text-ink">{example.meaning}</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{example.note}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {example.tags.map((tag) => (
                  <span key={tag} className="example-tag">
                    {tag}
                  </span>
                ))}
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
        <div className="landing-note-mark" aria-hidden="true">
          “
        </div>
        <div className="max-w-2xl">
          <p className="landing-kicker">问道的取舍</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
            五行可以参考，但不替你下结论。
          </h2>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            生辰、五行、音律和笔画，都是整理思路的工具。真正要留下来的，还是一个名字的声音、字义，以及它和人的关系。我们把依据写出来，也把不确定的地方标出来。
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <div>
            <p className="landing-kicker">
              <span aria-hidden="true" /> 一张取名纸的顺序
            </p>
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

      <section className="landing-final-cta mt-20 flex flex-col gap-6 rounded-[1.5rem] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div>
          <p className="text-xs tracking-[0.18em] text-[#b0643f]">轮到你的名字了</p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight text-ink sm:text-4xl">
            带上姓氏、生辰或行业，开始认真取一个名字。
          </h2>
        </div>
        <Link
          to="/name"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-ink px-6 text-sm text-paper-3 transition hover:bg-[#b0643f]"
        >
          进入取名工作台{" "}
          <span className="ml-3" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      <footer className="landing-footer mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <span>问道 · 取名有据</span>
        <span>先听声音，再看字义。</span>
      </footer>
    </main>
  );
}
