import { notFound } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { listWants } from "@/lib/repo";
import { CATEGORIES } from "@/lib/statuses";
import { config } from "@/lib/config";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicBuyList({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (handle.toLowerCase() !== config.handle) notFound();
  const wants = await listWants(true);
  const groups = [...CATEGORIES, null].map((c) => ({ c, items: wants.filter((w) => (c ? w.category === c : !w.category || !(CATEGORIES as readonly string[]).includes(w.category))) })).filter((g) => g.items.length);
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <div className="hero">
        <div className="logo" style={{ color: "#fff", marginBottom: 14 }}>Crate<span>Desk</span></div>
        <h1>{config.business} is buying</h1>
        <p>Retro games, vinyl and trading cards in {config.city} and across India. Have something on this list? Send an offer — no account needed, we reply directly.</p>
      </div>
      {groups.length === 0 ? <div className="empty">Nothing on the buy-list right now. Check back soon.</div> : groups.map((g) => (
        <section key={g.c ?? "other"}>
          <h2>{g.c ?? "Other"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {g.items.map((w) => (
              <div key={w.id} className="card">
                <div className="spread">
                  <h3 style={{ fontSize: 18 }}>{w.title}</h3>
                  {w.max_price_inr != null && <span className="price">up to {inr(w.max_price_inr)}</span>}
                </div>
                <div className="chips">
                  {[w.edition, w.min_condition && `Condition: ${w.min_condition} or better`].filter(Boolean).map((c) => <span key={c as string} className="chip">{c}</span>)}
                </div>
                {w.notes && <p style={{ margin: 0 }}>{w.notes}</p>}
                <details>
                  <summary className="btn small accent" style={{ listStyle: "none", width: "fit-content" }}>I have this — make an offer</summary>
                  <div style={{ marginTop: 14 }}><OfferForm wantId={w.id} /></div>
                </details>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="muted" style={{ textAlign: "center", marginTop: 30 }}>Powered by CrateDesk · the buying desk for collectibles dealers</p>
    </main>
  );
}
