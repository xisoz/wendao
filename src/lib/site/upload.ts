// 图片上传校验：按文件头判断真实类型（不信任扩展名 / Content-Type），限制大小，随机文件名。
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export type ImageExt = "jpg" | "png" | "webp";
export const MIME: Record<ImageExt, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const UPLOAD_NAME_RE = /^[a-f0-9]{24}\.(jpg|png|webp)$/;

export function uploadDir(): string {
  const v = process.env.UPLOAD_DIR?.trim();
  return path.resolve(v || "data/uploads");
}

export function sniff(buf: Uint8Array): ImageExt | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) return "png";
  const ascii = (a: number, b: number) => String.fromCharCode(...buf.subarray(a, b));
  if (buf.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export type ValidateResult = { ok: true; ext: ImageExt } | { ok: false; status: number; error: string };

export function validateImage(buf: Uint8Array): ValidateResult {
  if (!buf.length) return { ok: false, status: 400, error: "空文件" };
  if (buf.length > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "图片不能超过 5MB" };
  const ext = sniff(buf);
  if (!ext) return { ok: false, status: 415, error: "只支持 JPG、PNG、WebP 图片" };
  return { ok: true, ext };
}

export async function saveImage(buf: Uint8Array, dir = uploadDir()) {
  const v = validateImage(buf);
  if (!v.ok) return v;
  const name = `${randomBytes(12).toString("hex")}.${v.ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf, { flag: "wx" });
  return { ok: true as const, url: `/uploads/${name}`, bytes: buf.length, type: v.ext };
}

/** 读取上传文件；名称必须严格匹配随机名格式，杜绝路径穿越。 */
export async function readUpload(name: string, dir = uploadDir()) {
  if (!UPLOAD_NAME_RE.test(name)) return null;
  try {
    const buf = await readFile(path.join(dir, name));
    return { buf, mime: MIME[name.split(".").pop() as ImageExt] };
  } catch {
    return null;
  }
}
