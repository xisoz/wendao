// Markdown → HTML（移植自 wx-autoreply/lib/articles.js）。
// 安全策略：先把所有文本整体转义，只按白名单生成少量标签；
// 图片只允许本站上传目录的随机文件名，链接只允许 http(s)、站内路径与锚点。
// 因此输出可直接用于 dangerouslySetInnerHTML，不依赖第三方净化库。

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const UPLOAD_URL_RE = /^\/uploads\/[a-f0-9]{24}\.(jpg|png|webp)$/;

export function safeUrl(u: string, img = false): string | null {
  const v = String(u).trim();
  if (img) return UPLOAD_URL_RE.test(v) ? v : null;
  // 拒绝协议相对地址 //evil.com 与反斜杠变体
  if (/^\/[\\/]/.test(v)) return null;
  return /^(https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*|#[\w-]*)$/i.test(v) ? v : null;
}

function inline(src: string): string {
  const parts: string[] = [];
  let s = src.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, u: string) => {
    const v = safeUrl(u, true);
    parts.push(v ? `<img src="${esc(v)}" alt="${esc(alt)}" loading="lazy">` : esc(alt));
    return `\uE000${parts.length - 1}\uE001`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t: string, u: string) => {
    const v = safeUrl(u);
    parts.push(
      v
        ? `<a href="${esc(v)}"${/^https?:/i.test(v) ? ' rel="noopener nofollow" target="_blank"' : ""}>${esc(t)}</a>`
        : esc(t),
    );
    return `\uE000${parts.length - 1}\uE001`;
  });
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\uE000(\d+)\uE001/g, (_m, i: string) => parts[Number(i)]);
}

export function mdToHtml(md: string): string {
  const L = String(md ?? "")
    .replace(/\r/g, "")
    .replace(/[\uE000\uE001]/g, "")
    .split("\n")
    .map((l) => l.replace(/^\s+(?=(\d+\.|-)\s)/, ""));
  const out: string[] = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    let m: RegExpMatchArray | null;
    if (!l.trim()) { i++; continue; }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      const n = Math.max(2, m[1].length);
      out.push(`<h${n}>${inline(m[2])}</h${n}>`);
      i++;
      continue;
    }
    if (l.startsWith(">")) {
      const b: string[] = [];
      while (i < L.length && L[i].startsWith(">")) b.push(L[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${inline(b.join(" "))}</blockquote>`);
      continue;
    }
    if (l.startsWith("|")) {
      const rows: string[] = [];
      while (i < L.length && L[i].startsWith("|")) rows.push(L[i++]);
      const cells = (r: string) => r.split("|").slice(1, -1).map((c) => c.trim());
      const [hd, , ...b] = rows;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${cells(hd).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${b
          .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    if (/^(\d+\.|-)\s/.test(l)) {
      const ol = /^\d/.test(l);
      const re = ol ? /^\d+\.\s/ : /^-\s/;
      const items: string[] = [];
      while (i < L.length && re.test(L[i])) items.push(L[i++].replace(/^(\d+\.|-)\s+/, ""));
      const tag = ol ? "ol" : "ul";
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const p: string[] = [];
    while (i < L.length && L[i].trim() && !/^(#|>|\||-\s|\d+\.\s)/.test(L[i])) p.push(L[i++]);
    out.push(`<p>${inline(p.join(""))}</p>`);
  }
  return out.join("\n");
}

/** 去掉正文开头与标题重复的一级标题（旧文章 md 带 # 标题）。 */
export function stripLeadingTitle(body: string, title: string): string {
  return body.replace(/^\s*#\s+(.+)\n+/, (m, t: string) => (t.trim() === title.trim() ? "" : m));
}
