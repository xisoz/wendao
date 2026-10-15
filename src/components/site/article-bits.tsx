export function Cover({ src, category }: { src: string | null; category: string }) {
  return (
    <div className="article-cover">
      {src ? <img src={src} alt="" loading="lazy" /> : <div className="article-cover-fallback" aria-hidden="true">{category || "问道"}</div>}
    </div>
  );
}
