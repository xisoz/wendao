export function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 8 * 3600e3);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
