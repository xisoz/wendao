import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mdToHtml } from "@/lib/site/markdown";
import type { Article, ArticleSummary } from "@/lib/site/articles-repo";

type Api = <T>(path: string, init?: RequestInit) => Promise<T>;

function useApi(csrf: string | null): Api {
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (csrf) headers.set("x-csrf-token", csrf);
      if (typeof init.body === "string") headers.set("content-type", "application/json");
      const res = await fetch(`/api/admin/${path}`, { ...init, headers, credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as T & { error?: string };
      if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
      return data;
    },
    [csrf],
  );
}

/** 客户端压缩：长边不超过 1600px，重新编码为 WebP（不支持时 JPEG），顺带去掉 EXIF。 */
async function resizeImage(file: File, max = 1600): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("只支持 JPG、PNG、WebP 图片");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const enc = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));
  const blob = (await enc("image/webp")) ?? (await enc("image/jpeg"));
  if (!blob) throw new Error("图片处理失败");
  if (blob.size > 5 * 1024 * 1024) throw new Error("压缩后仍超过 5MB");
  return blob;
}

async function upload(api: Api, file: File): Promise<string> {
  const blob = await resizeImage(file);
  const fd = new FormData();
  fd.append("file", blob, "image");
  const r = await api<{ url: string }>("upload", { method: "POST", body: fd });
  return r.url;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 8 * 3600e3);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(`${v}:00+08:00`).toISOString() : null);

function stateLabel(a: Pick<ArticleSummary, "status" | "published_at">) {
  if (a.status === "draft") return { t: "草稿", c: "text-muted" };
  if (a.published_at && new Date(a.published_at).getTime() > Date.now()) return { t: "定时", c: "text-earth" };
  return { t: "已发布", c: "text-wood" };
}

export function AdminApp({ edit, onEdit }: { edit?: string; onEdit: (v?: string) => void }) {
  const [session, setSession] = useState<{ authed: boolean; csrf: string | null } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" })
      .then(async (r) => {
        const d = (await r.json()) as { authed?: boolean; csrf?: string | null; error?: string };
        if (!r.ok) throw new Error(d.error || "后台不可用");
        setSession({ authed: !!d.authed, csrf: d.csrf ?? null });
      })
      .catch((e: Error) => setErr(e.message));
  }, []);
  const api = useApi(session?.csrf ?? null);
  if (err) return <p className="mt-8 rounded-xl border border-line bg-paper-3 p-4 text-sm text-cinnabar">{err}</p>;
  if (!session) return <p className="mt-8 text-sm text-muted">加载中…</p>;
  if (!session.authed) return <Login onDone={(csrf) => setSession({ authed: true, csrf })} />;
  return (
    <>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="text-sm text-ink-soft"
          onClick={async () => {
            await api("logout", { method: "POST" }).catch(() => undefined);
            setSession({ authed: false, csrf: null });
          }}
        >
          退出登录
        </button>
      </div>
      {edit ? <Editor api={api} id={edit} onClose={() => onEdit(undefined)} /> : <List api={api} onEdit={onEdit} />}
    </>
  );
}

function Login({ onDone }: { onDone: (csrf: string) => void }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto mt-10 max-w-sm rounded-2xl border border-line bg-paper-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg("");
        try {
          const r = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password: pw }),
            credentials: "same-origin",
          });
          const d = (await r.json()) as { csrf?: string; error?: string };
          if (!r.ok || !d.csrf) throw new Error(d.error || "登录失败");
          onDone(d.csrf);
        } catch (e2) {
          setMsg((e2 as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-serif text-xl">站长登录</h2>
      <input type="password" className="wd-input mt-4" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="后台口令" aria-label="后台口令" />
      {msg ? <p className="mt-2 text-sm text-cinnabar">{msg}</p> : null}
      <button className="wd-btn mt-4 w-full" disabled={busy || !pw}>登录</button>
    </form>
  );
}

function List({ api, onEdit }: { api: Api; onEdit: (v?: string) => void }) {
  const [items, setItems] = useState<ArticleSummary[] | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => api<{ items: ArticleSummary[] }>("articles").then((d) => setItems(d.items)).catch((e: Error) => setMsg(e.message)), [api]);
  useEffect(() => { void load(); }, [load]);
  return (
    <section className="mt-2">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">文章管理</h2>
        <button type="button" className="wd-btn wd-btn-cin" onClick={() => onEdit("new")}>写文章</button>
      </div>
      {msg ? <p className="mt-3 text-sm text-cinnabar">{msg}</p> : null}
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper-3">
        {(items ?? []).map((a) => {
          const s = stateLabel(a);
          return (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif">{a.pinned ? <span className="pin-badge mr-1">置顶</span> : null}{a.title}</p>
                <p className="text-xs text-muted"><span className={s.c}>{s.t}</span> · {a.category || "未分类"} · /{a.slug}</p>
              </div>
              <button type="button" className="text-sm text-ink" onClick={() => onEdit(String(a.id))}>编辑</button>
              <button
                type="button"
                className="text-sm text-cinnabar"
                onClick={async () => {
                  if (!window.confirm(`删除《${a.title}》？此操作不可撤销。`)) return;
                  try { await api(`articles/${a.id}`, { method: "DELETE" }); await load(); } catch (e) { setMsg((e as Error).message); }
                }}
              >
                删除
              </button>
            </li>
          );
        })}
        {items && !items.length ? <li className="p-4 text-sm text-muted">还没有文章。</li> : null}
      </ul>
    </section>
  );
}

const EMPTY = { title: "", slug: "", summary: "", body: "", cover: null as string | null, category: "", tags: "", status: "draft" as Article["status"], pinned: false, published_at: null as string | null };

function Editor({ api, id, onClose }: { api: Api; id: string; onClose: () => void }) {
  const [f, setF] = useState(EMPTY);
  const [cur, setCur] = useState<number | null>(id === "new" ? null : Number(id));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (id === "new") return;
    api<{ item: Article }>(`articles/${id}`)
      .then(({ item }) => setF({ ...EMPTY, ...item, cover: item.cover ?? null }))
      .catch((e: Error) => setMsg(e.message));
  }, [api, id]);
  const preview = useMemo(() => mdToHtml(f.body), [f.body]);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async (status: Article["status"]) => {
    setBusy(true);
    setMsg("");
    try {
      const payload = JSON.stringify({ ...f, status });
      const r = cur
        ? await api<{ item: Article }>(`articles/${cur}`, { method: "PUT", body: payload })
        : await api<{ item: Article }>("articles", { method: "POST", body: payload });
      setCur(r.item.id);
      setF({ ...EMPTY, ...r.item });
      const s = stateLabel(r.item);
      setMsg(`已保存（${s.t}）`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const insertImage = async (file: File) => {
    try {
      setMsg("上传中…");
      const url = await upload(api, file);
      const ta = bodyRef.current;
      const pos = ta?.selectionStart ?? f.body.length;
      set("body", `${f.body.slice(0, pos)}\n![](${url})\n${f.body.slice(pos)}`);
      setMsg("图片已插入");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <section className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="text-sm text-ink-soft" onClick={onClose}>← 文章列表</button>
        <span className="text-xs text-muted">{cur ? `#${cur}` : "新文章"}</span>
      </div>
      <div className="mt-3 grid gap-3">
        <input className="wd-input font-serif text-lg" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="标题" aria-label="标题" />
        <div className="grid grid-cols-2 gap-2">
          <input className="wd-input" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="链接名（英文，如 bazi-basics）" aria-label="链接名" />
          <input className="wd-input" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="分类，如 八字" aria-label="分类" list="wd-cats" />
          <datalist id="wd-cats">{["八字", "取名", "六爻", "黄历", "民俗", "紫微", "典籍"].map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <textarea className="wd-input min-h-20" value={f.summary} onChange={(e) => set("summary", e.target.value)} placeholder="摘要（列表页显示）" aria-label="摘要" />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="wd-btn wd-btn-ghost cursor-pointer">
            {f.cover ? "更换封面" : "上传封面"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]; e.target.value = "";
              if (!file) return;
              try { setMsg("上传中…"); set("cover", await upload(api, file)); setMsg("封面已上传"); } catch (er) { setMsg((er as Error).message); }
            }} />
          </label>
          {f.cover ? <><img src={f.cover} alt="封面" className="h-12 w-20 rounded object-cover" /><button type="button" className="text-cinnabar" onClick={() => set("cover", null)}>移除</button></> : null}
          <label className="ml-auto inline-flex items-center gap-2"><input type="checkbox" checked={f.pinned} onChange={(e) => set("pinned", e.target.checked)} /> 置顶</label>
        </div>
        <label className="grid gap-1 text-sm text-ink-soft">
          发布时间（北京时间；设为将来即定时发布，留空则发布时取当前时间）
          <input type="datetime-local" className="wd-input" value={toLocalInput(f.published_at)} onChange={(e) => set("published_at", fromLocalInput(e.target.value))} />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-soft">正文 · Markdown</span>
            <label className="cursor-pointer text-cinnabar">
              插入图片
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void insertImage(file); }} />
            </label>
          </div>
          <textarea ref={bodyRef} className="wd-input min-h-72 font-mono text-sm leading-6" value={f.body} onChange={(e) => set("body", e.target.value)} placeholder={"## 小标题\n\n正文，**加粗**，[链接](https://…)\n\n- 列表"} aria-label="正文" />
        </div>
        <div>
          <p className="mb-2 text-sm text-ink-soft">实时预览</p>
          <div className="prose-wd min-h-72 rounded-xl border border-line bg-paper-3 p-3" dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      </div>

      {msg ? <p className="mt-3 text-sm text-cinnabar" role="status">{msg}</p> : null}
      <div className="sticky bottom-0 mt-4 flex gap-2 bg-paper py-3">
        <button type="button" className="wd-btn wd-btn-ghost flex-1" disabled={busy || !f.title} onClick={() => save("draft")}>存草稿</button>
        <button type="button" className="wd-btn wd-btn-cin flex-1" disabled={busy || !f.title} onClick={() => save("published")}>
          {f.published_at && new Date(f.published_at).getTime() > Date.now() ? "定时发布" : "发布"}
        </button>
        {cur && f.status === "published" ? <Link to="/articles/$slug" params={{ slug: f.slug }} className="wd-btn wd-btn-ghost">查看</Link> : null}
      </div>
    </section>
  );
}
