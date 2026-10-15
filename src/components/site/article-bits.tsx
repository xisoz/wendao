const COVER_TINTS = ["#b4442f", "#a8692e", "#5f7f5a", "#4d6a86", "#8a5a7a", "#9a7b3c"] as const;
const COVER_GLYPHS = ["道", "命", "辰", "衡", "字", "易", "和", "元"] as const;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function coverPattern(kind: number, tint: string, h: number): string {
  const soft = `color-mix(in srgb, ${tint} 16%, transparent)`;
  const faint = `color-mix(in srgb, ${tint} 9%, transparent)`;
  const x = 15 + (h % 70);
  const y = 15 + ((h >>> 8) % 70);
  switch (kind) {
    case 0:
      return `radial-gradient(circle at ${x}% ${y}%, ${soft}, transparent 58%)`;
    case 1:
      return `repeating-linear-gradient(${(h % 4) * 45}deg, ${faint} 0 2px, transparent 2px 14px), radial-gradient(circle at ${x}% ${y}%, ${faint}, transparent 60%)`;
    case 2:
      return `repeating-radial-gradient(circle at ${x}% ${y}%, ${faint} 0 2px, transparent 2px 18px)`;
    case 3:
      return `linear-gradient(${faint} 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, ${faint} 1px, transparent 1px) 0 0 / 22px 22px, radial-gradient(circle at ${x}% ${y}%, ${soft}, transparent 55%)`;
    default:
      return `linear-gradient(${120 + (h % 120)}deg, ${soft}, transparent 65%)`;
  }
}

/** 默认封面：按 slug 确定性地变换纹样、色调与字，避免多篇文章封面雷同。 */
export function coverStyle(seed: string) {
  const h = hashSeed(seed || "问道");
  const tint = COVER_TINTS[h % COVER_TINTS.length];
  const glyph = COVER_GLYPHS[(h >>> 4) % COVER_GLYPHS.length];
  const kind = (h >>> 12) % 5;
  return { tint, glyph, background: `${coverPattern(kind, tint, h >>> 16)}, var(--color-paper-2)` };
}

export function Cover({ src, category, seed = "" }: { src: string | null; category: string; seed?: string }) {
  const v = coverStyle(seed || category);
  return (
    <div className="article-cover">
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <div className="article-cover-fallback" aria-hidden="true" style={{ background: v.background, color: v.tint }}>
          <span className="article-cover-glyph">{v.glyph}</span>
          <span className="article-cover-label">{category || "问道"}</span>
        </div>
      )}
    </div>
  );
}
