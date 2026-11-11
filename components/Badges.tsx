import { verdict, type Listing } from "@/lib/repo";

export function ActorBadge({ actor, short = false }: { actor: string; short?: boolean }) {
  const cls = actor === "claude" ? "claude" : actor === "seller" ? "seller" : "human";
  const label = short
    ? actor === "claude" ? "Claude" : actor === "seller" ? "Seller" : "You"
    : actor === "claude" ? "Added by Claude" : actor === "seller" ? "Seller" : "Added by you";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function VerdictBadge({ l }: { l: Pick<Listing, "price_inr" | "fair_low_inr" | "fair_high_inr"> }) {
  const v = verdict(l);
  return v ? <span className={`badge ${v.key}`}>{v.label}</span> : null;
}
