import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ActorBadge, VerdictBadge } from "@/components/Badges";
import { ListingForm } from "@/components/ListingForm";
import { PriceChart } from "@/components/PriceChart";
import { logPrice, newListing, removeListing, saveListing } from "@/app/actions";
import { getListing, priceHistory } from "@/lib/repo";
import { inr, when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;

  if (id === "new") {
    return (
      <>
        <Nav />
        <main className="wrap">
          <p><Link href="/" className="muted">← Board</Link></p>
          <h1>Add a listing manually</h1>
          <p className="sub">Usually Claude does this for you — but you can always add or fix things by hand.</p>
          <div className="panel"><ListingForm action={newListing} submit="Add to board" /></div>
        </main>
      </>
    );
  }

  const l = await getListing(Number(id));
  if (!l) notFound();
  const hist = await priceHistory(l.id);

  return (
    <>
      <Nav />
      <main className="wrap">
        <p><Link href="/" className="muted">← Board</Link></p>
        {saved && <div className="flash">Saved. Claude will see your changes next time it reads the board.</div>}
        <div className="spread">
          <div>
            <h1>{l.title}</h1>
            <div className="row" style={{ gap: 8, marginBottom: 18 }}>
              <VerdictBadge l={l} />
              <ActorBadge actor={l.created_by} />
              {l.last_edited_by !== l.created_by && <span className="badge human">Edited by you</span>}
              <span className="muted">updated {when(l.updated_at)}</span>
            </div>
          </div>
          {l.source_url && <a className="btn ghost" href={l.source_url} target="_blank" rel="noreferrer">Open original listing ↗</a>}
        </div>

        <div className="layout-2">
          <section className="panel">
            <h2 style={{ marginTop: 0 }}>Details</h2>
            <ListingForm l={l} action={saveListing} submit="Save changes" />
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Price history</h2>
              <div className="spread" style={{ alignItems: "baseline", marginBottom: 8 }}>
                <span className="price">{inr(l.price_inr)}</span>
                <span className="fair">fair {inr(l.fair_low_inr)}–{inr(l.fair_high_inr)}</span>
              </div>
              <PriceChart points={hist.map((p) => ({ t: new Date(p.recorded_at).getTime(), v: p.price_inr }))} low={l.fair_low_inr} high={l.fair_high_inr} />
              <table>
                <tbody>
                  {hist.slice().reverse().map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{inr(p.price_inr)}</td>
                      <td><ActorBadge actor={p.actor} short /> <span className="muted">{p.note}</span></td>
                      <td className="muted">{when(p.recorded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <form action={logPrice} className="row" style={{ marginTop: 12 }}>
                <input type="hidden" name="id" value={l.id} />
                <input name="price_inr" placeholder="New price ₹" inputMode="numeric" style={{ width: 120 }} required />
                <input name="note" placeholder="Note" style={{ flex: 1, minWidth: 80 }} />
                <button className="btn small">Log</button>
              </form>
            </div>
            <form action={removeListing} className="panel">
              <input type="hidden" name="id" value={l.id} />
              <button className="btn danger small">Remove from board</button>
            </form>
          </aside>
        </div>
      </main>
    </>
  );
}
