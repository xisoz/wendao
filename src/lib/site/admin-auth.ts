// 站长后台鉴权：ADMIN_PASSWORD 环境变量 + HMAC 签名会话 Cookie + 登录限速 + CSRF。
// 本应用的 better-auth 走联合登录且默认关闭，单人站长后台用独立口令更稳妥。
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COOKIE = "wd_admin";
export const SESSION_TTL_MS = 7 * 24 * 3600e3;
const env = (k: string) => process.env[k]?.trim() || undefined;

export function adminPassword(): string | undefined {
  return env("ADMIN_PASSWORD");
}

function secret(): string | null {
  const s = env("ADMIN_SESSION_SECRET");
  if (s) return s;
  const pw = adminPassword();
  // 未单独设置时由口令派生：改口令即令旧会话全部失效
  return pw ? createHash("sha256").update(`wendao-admin-session:${pw}`).digest("hex") : null;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const hmac = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64url");

function safeEq(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function checkPassword(input: unknown): boolean {
  const pw = adminPassword();
  return !!pw && typeof input === "string" && safeEq(input, pw);
}

export function createSession(now = Date.now()): { token: string; csrf: string } {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD 未配置");
  const nonce = randomBytes(16).toString("hex");
  const payload = b64(JSON.stringify({ n: nonce, e: now + SESSION_TTL_MS }));
  return { token: `${payload}.${hmac(key, payload)}`, csrf: hmac(key, `csrf:${nonce}`) };
}

/** 校验会话；成功返回对应的 CSRF 令牌。 */
export function verifySession(token: string | undefined, now = Date.now()): { csrf: string } | null {
  const key = secret();
  if (!key || !token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEq(sig, hmac(key, payload))) return null;
  try {
    const { n, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { n: string; e: number };
    if (typeof e !== "number" || e < now || typeof n !== "string") return null;
    return { csrf: hmac(key, `csrf:${n}`) };
  } catch {
    return null;
  }
}

export function readCookie(req: Request, name = COOKIE): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return undefined;
}

export function sessionCookie(req: Request, token: string, maxAgeSec = SESSION_TTL_MS / 1000): string {
  const secure = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`;
}

/** 同源检查：有 Origin 头时必须与请求 Host 一致。 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// 登录限速：每个 IP 15 分钟内最多 5 次失败
export const RATE_WINDOW_MS = 15 * 60e3;
export const RATE_MAX_FAILS = 5;
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private max: number;
  private windowMs: number;
  constructor(max = RATE_MAX_FAILS, windowMs = RATE_WINDOW_MS) {
    this.max = max;
    this.windowMs = windowMs;
  }
  private recent(key: string, now: number) {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    this.hits.set(key, list);
    return list;
  }
  blocked(key: string, now = Date.now()) {
    return this.recent(key, now).length >= this.max;
  }
  fail(key: string, now = Date.now()) {
    this.recent(key, now).push(now);
    if (this.hits.size > 10000) this.hits.clear();
  }
  reset(key: string) {
    this.hits.delete(key);
  }
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}
