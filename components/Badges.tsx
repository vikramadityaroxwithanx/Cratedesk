import { assess, type Listing } from "@/lib/repo";

export function ActorBadge({ actor, short = false }: { actor: string; short?: boolean }) {
  const cls = actor === "claude" ? "claude" : actor === "seller" ? "seller" : "human";
  const label = short
    ? actor === "claude" ? "Claude" : actor === "seller" ? "Seller" : "Team"
    : actor === "claude" ? "Added by Claude" : actor === "seller" ? "Seller" : "Added by team";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function VerdictBadge({ l }: { l: Pick<Listing, "price_inr" | "fair_low_inr" | "fair_high_inr"> }) {
  const a = assess(l);
  return a ? <span className={`badge ${a.key}`}>{a.label}</span> : null;
}
