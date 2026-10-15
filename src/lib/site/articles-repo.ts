// 文章读写（参数化 SQL，基于 @/lib/db 的 Sql 接口，PGLite 与 Postgres 通用）。
import type { Sql } from "../db.ts";

export type ArticleStatus = "draft" | "published";
export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover: string | null;
  category: string;
  tags: string;
  status: ArticleStatus;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export type ArticleSummary = Omit<Article, "body">;
export interface ArticleInput {
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  cover?: string | null;
  category?: string;
  tags?: string;
  status?: ArticleStatus;
  pinned?: boolean;
  published_at?: string | null;
}

export const PAGE_SIZE = 8;
const COLS = "id, slug, title, summary, cover, category, tags, status, pinned, published_at, created_at, updated_at";
const iso = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString());
function norm<T extends Partial<Article>>(r: T): T {
  return { ...r, published_at: iso(r.published_at), created_at: iso(r.created_at), updated_at: iso(r.updated_at) } as T;
}

export class ValidationError extends Error {}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** 校验并规范化输入；拒绝不合法的封面地址、状态与时间。 */
export function cleanInput(input: ArticleInput) {
  const title = String(input.title ?? "").trim();
  if (!title || title.length > 120) throw new ValidationError("标题必填，且不超过 120 字");
  const slug = slugify(String(input.slug ?? "")) || `a-${Date.now().toString(36)}`;
  const status: ArticleStatus = input.status === "published" ? "published" : "draft";
  const cover = input.cover ? String(input.cover).trim() : null;
  if (cover && !/^\/uploads\/[a-f0-9]{24}\.(jpg|png|webp)$/.test(cover)) throw new ValidationError("封面必须是本站上传的图片");
  let published_at: string | null = null;
  if (input.published_at) {
    const d = new Date(input.published_at);
    if (Number.isNaN(d.getTime())) throw new ValidationError("发布时间格式不正确");
    published_at = d.toISOString();
  }
  if (status === "published" && !published_at) published_at = new Date().toISOString();
  const body = String(input.body ?? "");
  if (body.length > 200_000) throw new ValidationError("正文过长");
  return {
    slug,
    title,
    summary: String(input.summary ?? "").trim().slice(0, 300),
    body,
    cover,
    category: String(input.category ?? "").trim().slice(0, 20),
    tags: String(input.tags ?? "").trim().slice(0, 200),
    status,
    pinned: !!input.pinned,
    published_at,
  };
}

const PUBLIC = "status = 'published' and published_at is not null and published_at <= now()";

export async function listPublic(sql: Sql, { page = 1, category }: { page?: number; category?: string } = {}) {
  const p = Math.max(1, Math.floor(page) || 1);
  const where = category ? `${PUBLIC} and category = $1` : PUBLIC;
  const params: unknown[] = category ? [category] : [];
  const [{ n }] = await sql.query<{ n: number }>(`select count(*)::int as n from articles where ${where}`, params);
  const rows = await sql.query<ArticleSummary>(
    `select ${COLS} from articles where ${where} order by pinned desc, published_at desc, id desc limit ${PAGE_SIZE} offset ${(p - 1) * PAGE_SIZE}`,
    params,
  );
  const cats = await sql.query<{ category: string; n: number }>(
    `select category, count(*)::int as n from articles where ${PUBLIC} and category <> '' group by category order by min(published_at)`,
  );
  return { items: rows.map(norm), total: n, page: p, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)), categories: cats };
}

export async function getPublicBySlug(sql: Sql, slug: string): Promise<Article | null> {
  const [row] = await sql.query<Article>(`select ${COLS}, body from articles where slug = $1 and ${PUBLIC}`, [slug]);
  return row ? norm(row) : null;
}

export async function listAll(sql: Sql): Promise<ArticleSummary[]> {
  const rows = await sql.query<ArticleSummary>(`select ${COLS} from articles order by pinned desc, coalesce(published_at, updated_at) desc, id desc`);
  return rows.map(norm);
}

export async function getById(sql: Sql, id: number): Promise<Article | null> {
  const [row] = await sql.query<Article>(`select ${COLS}, body from articles where id = $1`, [id]);
  return row ? norm(row) : null;
}

async function slugTaken(sql: Sql, slug: string, exceptId?: number) {
  const rows = await sql.query(`select 1 from articles where slug = $1 and id <> $2`, [slug, exceptId ?? -1]);
  return rows.length > 0;
}

export async function createArticle(sql: Sql, input: ArticleInput): Promise<Article> {
  const a = cleanInput(input);
  if (await slugTaken(sql, a.slug)) throw new ValidationError("链接名已被占用");
  const [row] = await sql.query<Article>(
    `insert into articles (slug, title, summary, body, cover, category, tags, status, pinned, published_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning ${COLS}, body`,
    [a.slug, a.title, a.summary, a.body, a.cover, a.category, a.tags, a.status, a.pinned, a.published_at],
  );
  return norm(row);
}

export async function updateArticle(sql: Sql, id: number, input: ArticleInput): Promise<Article | null> {
  const a = cleanInput(input);
  if (await slugTaken(sql, a.slug, id)) throw new ValidationError("链接名已被占用");
  const [row] = await sql.query<Article>(
    `update articles set slug=$2, title=$3, summary=$4, body=$5, cover=$6, category=$7, tags=$8, status=$9, pinned=$10,
       published_at=$11, updated_at=now() where id=$1 returning ${COLS}, body`,
    [id, a.slug, a.title, a.summary, a.body, a.cover, a.category, a.tags, a.status, a.pinned, a.published_at],
  );
  return row ? norm(row) : null;
}

export async function deleteArticle(sql: Sql, id: number): Promise<boolean> {
  const rows = await sql.query(`delete from articles where id = $1 returning id`, [id]);
  return rows.length > 0;
}
