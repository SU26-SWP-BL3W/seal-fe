/** Rút gọn UUID/hash dài để hiển thị trên UI — giữ 8 ký tự đầu. */
export function formatShortId(id?: string | null, length = 8): string {
  if (!id) return "—";
  const clean = id.replace(/-/g, "");
  if (clean.length <= length) return clean.toUpperCase();
  return clean.slice(0, length).toUpperCase();
}
