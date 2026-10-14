// 站长后台 API：/api/admin/*。纯 Request → Response，便于单测。
import type { Sql } from "../db.ts";
import {
  adminPassword, checkPassword, clientIp, COOKIE, createSession, RateLimiter, readCookie, sameOrigin, sessionCookie, verifySession,
} from "./admin-auth.ts";
import { createArticle, deleteArticle, getById, listAll, updateArticle, ValidationError, type ArticleInput } from "./articles-repo.ts";
import { MAX_UPLOAD_BYTES, saveImage } from "./upload.ts";

export interface AdminDeps {
  getSql: () => Promise<Sql>;
  limiter: RateLimiter;
  uploadDir?: string;
}

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

const globalRef = globalThis as typeof globalThis & { __wdAdminLimiter__?: RateLimiter };
export const sharedLimiter = (globalRef.__wdAdminLimiter__ ??= new RateLimiter());

export async function handleAdmin(req: Request, deps: AdminDeps): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/+$/, "");
  const method = req.method.toUpperCase();
  if (!adminPassword()) return json({ error: "后台未启用：请设置 ADMIN_PASSWORD 环境变量" }, 503);

  const session = verifySession(readCookie(req, COOKIE));
  const mutating = method !== "GET" && method !== "HEAD";
  if (mutating && !sameOrigin(req)) return json({ error: "来源不合法" }, 403);

  if (path === "session" && method === "GET") return json({ authed: !!session, csrf: session?.csrf ?? null });

  if (path === "login" && method === "POST") {
    const ip = clientIp(req);
    if (deps.limiter.blocked(ip)) return json({ error: "尝试次数过多，请 15 分钟后再试" }, 429);
    let body: { password?: unknown } = {};
    try { body = (await req.json()) as typeof body; } catch { /* empty */ }
    if (!checkPassword(body.password)) {
      deps.limiter.fail(ip);
      return json({ error: "口令不正确" }, 401);
    }
    deps.limiter.reset(ip);
    const s = createSession();
    return json({ ok: true, csrf: s.csrf }, 200, { "set-cookie": sessionCookie(req, s.token) });
  }

  if (!session) return json({ error: "请先登录" }, 401);
  if (mutating && req.headers.get("x-csrf-token") !== session.csrf) return json({ error: "CSRF 校验失败，请刷新页面" }, 403);

  if (path === "logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": sessionCookie(req, "", 0) });

  if (path === "upload" && method === "POST") {
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_UPLOAD_BYTES + 64 * 1024) return json({ error: "图片不能超过 5MB" }, 413);
    let file: FormDataEntryValue | null = null;
    try { file = (await req.formData()).get("file"); } catch { return json({ error: "上传格式不正确" }, 400); }
    if (!file || typeof file === "string") return json({ error: "缺少文件" }, 400);
    if (file.size > MAX_UPLOAD_BYTES) return json({ error: "图片不能超过 5MB" }, 413);
    const r = await saveImage(new Uint8Array(await file.arrayBuffer()), deps.uploadDir);
    return r.ok ? json(r) : json({ error: r.error }, r.status);
  }

  const sql = await deps.getSql();
  const m = path.match(/^articles(?:\/(\d+))?$/);
  if (!m) return json({ error: "未找到" }, 404);
  const id = m[1] ? Number(m[1]) : null;
  try {
    if (id == null && method === "GET") return json({ items: await listAll(sql) });
    if (id == null && method === "POST") return json({ item: await createArticle(sql, (await req.json()) as ArticleInput) }, 201);
    if (id != null && method === "GET") {
      const a = await getById(sql, id);
      return a ? json({ item: a }) : json({ error: "未找到" }, 404);
    }
    if (id != null && method === "PUT") {
      const a = await updateArticle(sql, id, (await req.json()) as ArticleInput);
      return a ? json({ item: a }) : json({ error: "未找到" }, 404);
    }
    if (id != null && method === "DELETE") return (await deleteArticle(sql, id)) ? json({ ok: true }) : json({ error: "未找到" }, 404);
  } catch (e) {
    if (e instanceof ValidationError) return json({ error: e.message }, 400);
    if (e instanceof SyntaxError) return json({ error: "请求格式不正确" }, 400);
    throw e;
  }
  return json({ error: "方法不支持" }, 405);
}
