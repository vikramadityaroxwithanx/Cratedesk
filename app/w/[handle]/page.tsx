import { notFound } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { listWants } from "@/lib/repo";
import { config } from "@/lib/config";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicWants({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (handle.toLowerCase() !== config.handle) notFound();
  const wants = await listWants(true);
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <div className="hero">
        <div className="logo" style={{ color: "#fff", marginBottom: 14 }}>Retro<span>Radar</span></div>
        <h1>{config.name} is looking for…</h1>
        <p>Got one of these? Send an offer — no account needed. {config.name} gets it instantly.</p>
      </div>
      {wants.length === 0 ? <div className="empty">Nothing on the list right now. Check back soon.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {wants.map((w) => (
            <div key={w.id} className="card">
              <div className="spread">
                <h3 style={{ fontSize: 18 }}>{w.title}</h3>
                {w.max_price_inr != null && <span className="price">up to {inr(w.max_price_inr)}</span>}
              </div>
              <div className="chips">
                {[w.platform, w.region && `Region: ${w.region}`, w.min_condition && `Condition: ${w.min_condition}+`].filter(Boolean).map((c) => <span key={c as string} className="chip">{c}</span>)}
              </div>
              {w.notes && <p style={{ margin: 0 }}>{w.notes}</p>}
              <details>
                <summary className="btn small accent" style={{ listStyle: "none", width: "fit-content" }}>I have this — make an offer</summary>
                <div style={{ marginTop: 14 }}><OfferForm wantId={w.id} /></div>
              </details>
            </div>
          ))}
        </div>
      )}
      <p className="muted" style={{ textAlign: "center", marginTop: 30 }}>Powered by RetroRadar · sourcing boards for retro collectors in India</p>
    </main>
  );
}
