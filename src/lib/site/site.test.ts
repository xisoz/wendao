import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as L from "./liuyao.ts";
import { huangli, parseYmd } from "./huangli.ts";
import { mdToHtml, safeUrl } from "./markdown.ts";
import { MAX_UPLOAD_BYTES, readUpload, saveImage, sniff, validateImage } from "./upload.ts";
import { createSession, RateLimiter, verifySession, checkPassword, sameOrigin } from "./admin-auth.ts";
import { handleAdmin } from "./admin-api.ts";
import { listPublic, getPublicBySlug, cleanInput, ValidationError } from "./articles-repo.ts";
import type { Sql } from "../db.ts";

const NOW = Date.parse("2026-10-14T04:00:00Z");

describe("六爻", () => {
  const hex = (n: string) => {
    for (const u of Object.keys(L.TRI)) for (const d of Object.keys(L.TRI)) {
      const l = [...L.TRI[d], ...L.TRI[u]] as L.Lines;
      if (L.hexName(l) === n) return l;
    }
    throw new Error(n);
  };
  const row = (a: ReturnType<typeof L.analyze>) => a.yao.map((y) => y.qin + y.gan + y.zhi + y.el).join(" ");
  it("八宫世应、纳甲、六亲（对照经典装卦）", () => {
    let a = L.analyze(hex("乾为天"));
    assert.equal(a.kind, "本宫卦"); assert.equal(a.shi, 6); assert.equal(a.ying, 3);
    assert.equal(row(a), "子孙甲子水 妻财甲寅木 父母甲辰土 官鬼壬午火 兄弟壬申金 父母壬戌土");
    a = L.analyze(hex("天风姤")); assert.equal(a.palace + a.kind + a.shi, "乾一世卦1"); assert.equal(row(a).split(" ")[0], "父母辛丑土");
    a = L.analyze(hex("火地晋")); assert.equal(a.kind + a.shi + a.ying, "游魂卦41");
    a = L.analyze(hex("火天大有")); assert.equal(a.kind + a.shi, "归魂卦3");
    a = L.analyze(hex("地天泰")); assert.equal(a.palace + a.kind, "坤三世卦");
    assert.equal(row(a), "妻财甲子水 官鬼甲寅木 兄弟甲辰土 兄弟癸丑土 妻财癸亥水 子孙癸酉金");
    assert.equal(L.analyze(hex("水火既济")).palace + L.analyze(hex("水火既济")).kind, "坎三世卦");
    assert.equal(L.analyze(hex("雷泽归妹")).palace + L.analyze(hex("雷泽归妹")).kind, "兑归魂卦");
    assert.equal(L.analyze(hex("山水蒙")).palace + L.analyze(hex("山水蒙")).kind, "离四世卦");
    assert.equal(L.analyze(hex("风山渐")).palace + L.analyze(hex("风山渐")).kind, "艮归魂卦");
  });
  it("64 卦各属一宫，八宫各 8 卦", () => {
    const cnt: Record<string, number> = {};
    for (const u of Object.keys(L.TRI)) for (const d of Object.keys(L.TRI)) {
      const p = L.analyze([...L.TRI[d], ...L.TRI[u]] as L.Lines).palace;
      cnt[p] = (cnt[p] || 0) + 1;
    }
    assert.deepEqual(Object.values(cnt), Array(8).fill(8));
  });
  it("动变：节之困，初九、六四动；月建日辰旬空", () => {
    const t = L.liuyaoText("六爻 问工作", { sums: [9, 7, 8, 6, 7, 8], now: NOW });
    assert.match(t, /^六爻｜水泽节 之 泽水困/); assert.match(t, /坎宫（水）一世卦/); assert.match(t, /泽水困（兑宫一世卦）/);
    assert.match(t, /初 虎 ▅▅▅○妻财丁巳火世→子孙戊寅木/); assert.match(t, /四 雀 ▅ ▅×父母戊申金应→兄弟丁亥水/);
    assert.match(t, /日辰\u3000辛酉日\u3000旬空子丑/); assert.match(t, /月建\u3000戊戌月/); assert.match(t, /所问】\n\u3000工作/);
    assert.match(t, /以上为传统文化参照/);
  });
  it("静卦、掷钱、敏感问题提示", () => {
    assert.match(L.liuyaoText("六爻", { sums: [7, 7, 7, 7, 7, 7], now: NOW }), /六爻安静/);
    assert.equal(L.toss(() => 1).join(), "9,9,9,9,9,9"); assert.equal(L.toss(() => 0).join(), "6,6,6,6,6,6");
    assert.match(L.liuyaoText("六爻 投资股票", { sums: [7, 7, 7, 7, 7, 7] }), /持牌专业人士/);
    const r = L.castLiuyao("", {});
    assert.equal(r.rows.length, 6); assert.ok(r.sums.every((v) => v >= 6 && v <= 9));
  });
});

describe("黄历", () => {
  it("真实历法数据", () => {
    const h = huangli({ y: 2026, m: 10, d: 14 });
    assert.equal(h.lunar, "九月初五"); assert.equal(h.ganzhi.year, "丙午"); assert.equal(h.ganzhi.day, "辛酉");
    assert.equal(h.yi[0], "嫁娶"); assert.equal(h.chong, "冲(乙卯)兔");
  });
  it("日期解析拒绝非法日期", () => {
    assert.deepEqual(parseYmd("2026-10-01"), { y: 2026, m: 10, d: 1 });
    assert.equal(parseYmd("2026-02-30"), null); assert.equal(parseYmd("abc"), null);
  });
});

describe("Markdown 净化（XSS）", () => {
  it("转义原始 HTML 与事件属性", () => {
    const h = mdToHtml('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n**"x"**');
    assert.ok(!/<script|<img src=x/.test(h)); assert.match(h, /&lt;script&gt;/); assert.match(h, /<strong>&quot;x&quot;<\/strong>/);
  });
  it("链接与图片白名单", () => {
    assert.ok(!mdToHtml("[a](javascript:alert(1))").includes("href"));
    assert.ok(!mdToHtml("[a](//evil.com)").includes("href"));
    assert.ok(!mdToHtml('[a](https://x.com/"onmouseover=1)').includes("onmouseover=1\""));
    assert.ok(!mdToHtml("![a](https://evil.com/x.png)").includes("<img"));
    assert.match(mdToHtml("![封面](/uploads/0123456789abcdef01234567.png)"), /<img src="\/uploads\/0123456789abcdef01234567.png" alt="封面"/);
    assert.match(mdToHtml("[问道](https://example.com)"), /rel="noopener nofollow"/);
    assert.equal(safeUrl("data:text/html,x"), null);
  });
  it("结构：标题、列表、表格、引用", () => {
    assert.match(mdToHtml("- a\n  1. b\n  2. c"), /<ol><li>b<\/li><li>c<\/li><\/ol>/);
    assert.match(mdToHtml("# 标题"), /<h2>标题<\/h2>/);
    assert.match(mdToHtml("| a | b |\n|---|---|\n| <i> | 2 |"), /<td>&lt;i&gt;<\/td>/);
    assert.match(mdToHtml("> 引"), /<blockquote>引<\/blockquote>/);
  });
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const WEBP = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);

describe("上传校验", () => {
  it("按文件头识别类型", () => {
    assert.equal(sniff(PNG), "png"); assert.equal(sniff(JPG), "jpg"); assert.equal(sniff(WEBP), "webp");
    assert.equal(sniff(Buffer.from("GIF89a......")), null);
    assert.equal(sniff(Buffer.from("<svg onload=alert(1)>")), null);
  });
  it("大小与空文件", () => {
    assert.equal(validateImage(new Uint8Array()).ok, false);
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(PNG);
    const r = validateImage(big); assert.ok(!r.ok && r.status === 413);
  });
  it("随机文件名落盘，读取拒绝路径穿越", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "wd-up-"));
    const r = await saveImage(PNG, dir);
    assert.ok(r.ok); if (!r.ok) return;
    assert.match(r.url, /^\/uploads\/[a-f0-9]{24}\.png$/);
    assert.deepEqual(readdirSync(dir), [r.url.split("/").pop()]);
    assert.ok(await readUpload(r.url.split("/").pop()!, dir));
    assert.equal(await readUpload("../etc/passwd", dir), null);
    assert.equal(await readUpload("0123456789abcdef01234567.svg", dir), null);
  });
});

// ---- 后台：PGLite 内存库 + 迁移 ----
let closePg: (() => Promise<void>) | null = null;
async function memSql(): Promise<Sql> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite({ parsers: { 20: Number } });
  const root = path.resolve(import.meta.dirname, "../../../migrations");
  for (const f of readdirSync(root).filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(path.join(root, f), "utf8"));
  closePg = () => pg.close();
  const sql = (async () => { throw new Error("unused"); }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows) as Sql["query"];
  return sql;
}

describe("后台鉴权与文章 CRUD", () => {
  let sql: Sql;
  const upDir = mkdtempSync(path.join(tmpdir(), "wd-admin-"));
  before(async () => {
    process.env.ADMIN_PASSWORD = "correct horse battery";
    delete process.env.ADMIN_SESSION_SECRET;
    sql = await memSql();
  });
  after(async () => { await closePg?.(); });
  const H = "http://site.test";
  const deps = () => ({ getSql: async () => sql, limiter: new RateLimiter(), uploadDir: upDir });
  const req = (p: string, init: RequestInit & { cookie?: string; csrf?: string } = {}) => {
    const headers = new Headers(init.headers);
    headers.set("host", "site.test");
    if (init.cookie) headers.set("cookie", init.cookie);
    if (init.csrf) headers.set("x-csrf-token", init.csrf);
    if (init.body && typeof init.body === "string") headers.set("content-type", "application/json");
    return new Request(H + p, { ...init, headers });
  };
  async function login(d = deps()) {
    const r = await handleAdmin(req("/api/admin/login", { method: "POST", body: JSON.stringify({ password: "correct horse battery" }) }), d);
    assert.equal(r.status, 200);
    const cookie = r.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    return { cookie: cookie.split(";")[0], csrf: ((await r.json()) as { csrf: string }).csrf };
  }

  it("会话签名、过期与篡改", () => {
    const s = createSession(NOW);
    assert.equal(verifySession(s.token, NOW)?.csrf, s.csrf);
    assert.equal(verifySession(s.token, NOW + 8 * 24 * 3600e3), null);
    assert.equal(verifySession(s.token.slice(0, -2) + "xx", NOW), null);
    assert.equal(verifySession("garbage", NOW), null);
    assert.equal(checkPassword("wrong"), false); assert.equal(checkPassword("correct horse battery"), true);
  });
  it("未配置口令时后台关闭", async () => {
    const pw = process.env.ADMIN_PASSWORD; delete process.env.ADMIN_PASSWORD;
    assert.equal((await handleAdmin(req("/api/admin/session"), deps())).status, 503);
    process.env.ADMIN_PASSWORD = pw;
  });
  it("错误口令 401，超过 5 次 429 限速", async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) {
      const r = await handleAdmin(req("/api/admin/login", { method: "POST", body: JSON.stringify({ password: "x" }) }), d);
      assert.equal(r.status, 401);
    }
    const r = await handleAdmin(req("/api/admin/login", { method: "POST", body: JSON.stringify({ password: "correct horse battery" }) }), d);
    assert.equal(r.status, 429);
  });
  it("未登录 401；缺 CSRF 或跨站来源 403", async () => {
    assert.equal((await handleAdmin(req("/api/admin/articles"), deps())).status, 401);
    const { cookie, csrf } = await login();
    const body = JSON.stringify({ title: "x" });
    assert.equal((await handleAdmin(req("/api/admin/articles", { method: "POST", body, cookie }), deps())).status, 403);
    assert.equal((await handleAdmin(req("/api/admin/articles", { method: "POST", body, cookie, csrf: "bad" }), deps())).status, 403);
    const cross = req("/api/admin/articles", { method: "POST", body, cookie, csrf, headers: { origin: "https://evil.example" } });
    assert.equal(sameOrigin(cross), false);
    assert.equal((await handleAdmin(cross, deps())).status, 403);
  });
  it("种子文章公开可见（9 篇），分页与分类", async () => {
    const p = await listPublic(sql);
    assert.equal(p.total, 9); assert.equal(p.items.length, 8); assert.equal(p.pages, 2);
    assert.ok(!p.items.some((a) => a.title.includes("立冬")));
    assert.equal((await listPublic(sql, { category: "取名" })).total, 2);
    assert.ok(await getPublicBySlug(sql, "bazi-basics"));
  });
  it("新建草稿 → 发布置顶 → 定时 → 删除", async () => {
    const { cookie, csrf } = await login();
    const call = async (p: string, method: string, data?: unknown) => {
      const r = await handleAdmin(req(p, { method, cookie, csrf, body: data ? JSON.stringify(data) : undefined }), deps());
      return { status: r.status, data: (await r.json()) as { item?: { id: number; slug: string; status: string }; items?: unknown[]; error?: string } };
    };
    const c = await call("/api/admin/articles", "POST", { title: "测试文章", slug: "test-one", body: "正文<script>", category: "取名" });
    assert.equal(c.status, 201); assert.equal(c.data.item!.status, "draft");
    const id = c.data.item!.id;
    assert.equal(await getPublicBySlug(sql, "test-one"), null, "草稿不公开");
    assert.equal((await call("/api/admin/articles", "POST", { title: "重复", slug: "test-one" })).status, 400);
    assert.equal((await call("/api/admin/articles", "POST", { title: "" })).status, 400);
    assert.equal((await call("/api/admin/articles", "POST", { title: "坏封面", cover: "https://evil/x.png" })).status, 400);

    const u = await call(`/api/admin/articles/${id}`, "PUT", { title: "测试文章", slug: "test-one", body: "正文", status: "published", pinned: true, category: "取名" });
    assert.equal(u.status, 200);
    const first = (await listPublic(sql)).items[0];
    assert.equal(first.slug, "test-one", "置顶排第一");

    const future = new Date(Date.now() + 86400e3).toISOString();
    await call(`/api/admin/articles/${id}`, "PUT", { title: "测试文章", slug: "test-one", status: "published", published_at: future });
    assert.equal(await getPublicBySlug(sql, "test-one"), null, "定时发布前不公开");

    assert.equal((await call(`/api/admin/articles/${id}`, "GET")).status, 200);
    assert.equal((await call(`/api/admin/articles/${id}`, "DELETE")).status, 200);
    assert.equal((await call(`/api/admin/articles/${id}`, "GET")).status, 404);
  });
  it("上传接口：校验类型并返回随机地址", async () => {
    const { cookie, csrf } = await login();
    const up = async (bytes: Uint8Array<ArrayBuffer> | Buffer, name: string) => {
      const fd = new FormData(); fd.append("file", new Blob([new Uint8Array(bytes)]), name);
      return handleAdmin(new Request(H + "/api/admin/upload", { method: "POST", body: fd, headers: { host: "site.test", cookie, "x-csrf-token": csrf } }), deps());
    };
    const ok = await up(PNG, "a.png"); assert.equal(ok.status, 200);
    assert.match(((await ok.json()) as { url: string }).url, /^\/uploads\/[a-f0-9]{24}\.png$/);
    assert.equal((await up(Buffer.from("<svg/>"), "evil.png")).status, 415);
  });
  it("输入规范化", () => {
    assert.throws(() => cleanInput({ title: "x", published_at: "not a date" }), ValidationError);
    assert.equal(cleanInput({ title: "x", slug: "Hello 世界 World!" }).slug, "hello-world");
    assert.ok(cleanInput({ title: "x", status: "published" }).published_at);
  });
});
