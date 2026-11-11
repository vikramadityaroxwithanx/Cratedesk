import { inr } from "@/lib/format";

/** Tiny dependency-free SVG step chart of asking price over time, with the fair band shaded. */
export function PriceChart({ points, low, high }: { points: { t: number; v: number }[]; low: number | null; high: number | null }) {
  if (points.length < 2) return <p className="muted">Price history appears here as the price changes.</p>;
  const W = 280, H = 110, P = 8;
  const vals = [...points.map((p) => p.v), ...(low != null ? [low] : []), ...(high != null ? [high] : [])];
  const min = Math.min(...vals) * 0.95, max = Math.max(...vals) * 1.05;
  const t0 = points[0].t, t1 = points[points.length - 1].t || t0 + 1;
  const x = (t: number) => P + ((t - t0) / Math.max(1, t1 - t0)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / Math.max(1, max - min)) * (H - 2 * P);
  let d = `M${x(points[0].t)},${y(points[0].v)}`;
  for (let i = 1; i < points.length; i++) d += ` H${x(points[i].t)} V${y(points[i].v)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Asking price over time" style={{ margin: "4px 0 10px" }}>
      {low != null && high != null && (
        <rect x={P} width={W - 2 * P} y={y(high)} height={Math.max(1, y(low) - y(high))} fill="#e6f4ea" />
      )}
      <path d={d} fill="none" stroke="#d9480f" strokeWidth="2.5" />
      {points.map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.v)} r="3.5" fill="#d9480f"><title>{inr(p.v)}</title></circle>)}
    </svg>
  );
}
