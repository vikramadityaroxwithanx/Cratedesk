export const inr = (n: number | null | undefined) =>
  n == null ? "—" : "₹" + new Intl.NumberFormat("en-IN").format(n);

export const when = (d: Date | string) => {
  const date = new Date(d);
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
