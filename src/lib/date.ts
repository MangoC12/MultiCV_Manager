export function dateRank(date?: string) {
  if (!date || date.toLowerCase() === "present") return Number.MAX_SAFE_INTEGER;
  const [year, month = "12"] = date.split("-");
  return Number(year) * 12 + Number(month);
}
