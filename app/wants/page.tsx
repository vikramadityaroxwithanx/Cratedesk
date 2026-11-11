import { Nav } from "@/components/Nav";
import { ActorBadge } from "@/components/Badges";
import { markOffer, newWant, removeWant, saveWant } from "@/app/actions";
import { listOffers, listWants } from "@/lib/repo";
import { config } from "@/lib/config";
import { inr, when } from "@/lib/format";

export const dynamic = "force-dynamic";

const sel = (name: string, vals: string[], v?: string | null) => (
  <select name={name} defaultValue={v ?? ""}>
    <option value="">—</option>
    {vals.map((x) => <option key={x}>{x}</option>)}
  </select>
);

export default async function WantsPage() {
  const [wants, offers] = await Promise.all([listWants(), listOffers()]);
  return (
    <>
      <Nav />
      <main className="wrap">
        <h1>Want-list &amp; offers</h1>
        <p className="sub">
          What you&apos;re hunting for. It&apos;s public at <a href={`/w/${config.handle}`} target="_blank" className="code">/w/{config.handle}</a> — share it in collector groups and sellers send offers straight here.
        </p>

        <h2>Seller offers</h2>
        {offers.length === 0 ? <div className="empty">No offers yet. Share your public page to get some.</div> : (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>For</th><th>Seller</th><th>Price</th><th>Condition</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id}>
                    <td>{o.want_title}</td>
                    <td>{o.seller_name}<div className="muted">{o.contact}</div></td>
                    <td className="mono">{inr(o.price_inr)}</td>
                    <td>{o.condition ?? "—"}</td>
                    <td style={{ maxWidth: 260 }}>{o.message ?? "—"}</td>
                    <td className="muted">{when(o.created_at)}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <span className={`badge ${o.status === "accepted" ? "deal" : o.status === "declined" ? "high" : "fair"}`}>{o.status}</span>
                        {(["accepted", "declined"] as const).filter((st) => st !== o.status).map((st) => (
                          <form key={st} action={markOffer}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="status" value={st} />
                            <button className="btn small ghost">{st === "accepted" ? "Accept" : "Decline"}</button>
                          </form>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2>Wanted items</h2>
        <div className="grid">
          {wants.map((w) => (
            <div key={w.id} className="card">
              <form action={saveWant} className="grid-form">
                <input type="hidden" name="id" value={w.id} />
                <input type="hidden" name="active_present" value="1" />
                <label className="full">Item<input name="title" defaultValue={w.title} required /></label>
                <label>Platform<input name="platform" defaultValue={w.platform ?? ""} /></label>
                <label>Max price (₹)<input name="max_price_inr" inputMode="numeric" defaultValue={w.max_price_inr ?? ""} /></label>
                <label>Region{sel("region", ["PAL", "NTSC-U", "NTSC-J", "Any"], w.region)}</label>
                <label>Min condition{sel("min_condition", ["Mint", "Excellent", "Good", "Fair", "Any"], w.min_condition)}</label>
                <label className="full">Note to sellers<textarea name="notes" defaultValue={w.notes ?? ""} /></label>
                <label className="full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="active" defaultChecked={w.active} /> Show on public page
                </label>
                <div className="full spread" style={{ alignItems: "center" }}>
                  <div className="row" style={{ gap: 6 }}><ActorBadge actor={w.created_by} /><span className="muted">{w.offer_count} offer(s)</span></div>
                  <button className="btn small">Save</button>
                </div>
              </form>
              <form action={removeWant}><input type="hidden" name="id" value={w.id} /><button className="btn danger small">Remove</button></form>
            </div>
          ))}
          <div className="card">
            <h3>Add a wanted item</h3>
            <form action={newWant} className="grid-form">
              <label className="full">Item<input name="title" required placeholder="e.g. Nintendo 64 with Expansion Pak" /></label>
              <label>Platform<input name="platform" /></label>
              <label>Max price (₹)<input name="max_price_inr" inputMode="numeric" /></label>
              <label>Region{sel("region", ["PAL", "NTSC-U", "NTSC-J", "Any"])}</label>
              <label>Min condition{sel("min_condition", ["Mint", "Excellent", "Good", "Fair", "Any"])}</label>
              <label className="full">Note to sellers<textarea name="notes" /></label>
              <div className="full"><button className="btn accent small">Add</button></div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
