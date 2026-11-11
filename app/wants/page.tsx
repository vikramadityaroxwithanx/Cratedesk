import { Nav } from "@/components/Nav";
import { ActorBadge } from "@/components/Badges";
import { markOffer, newWant, removeWant, saveWant } from "@/app/actions";
import { listOffers, listWants } from "@/lib/repo";
import { config } from "@/lib/config";
import { CATEGORIES, CONDITIONS } from "@/lib/statuses";
import { inr, when } from "@/lib/format";

export const dynamic = "force-dynamic";

const sel = (name: string, vals: readonly string[], v?: string | null) => (
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
        <h1>Buy-list &amp; offers</h1>
        <p className="sub">
          What you&apos;re buying. It&apos;s public at <a href={`/buy/${config.handle}`} target="_blank" className="code">/buy/{config.handle}</a> — share it on Instagram, in collector groups and on your shop counter, and sellers send offers straight here.
        </p>

        <h2>Seller offers</h2>
        {offers.length === 0 ? <div className="empty">No offers yet. Share your public buy-list to get some.</div> : (
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

        <h2>Buying now</h2>
        <div className="grid">
          {wants.map((w) => (
            <div key={w.id} className="card">
              <form action={saveWant} className="grid-form">
                <input type="hidden" name="id" value={w.id} />
                <input type="hidden" name="active_present" value="1" />
                <label className="full">Item<input name="title" defaultValue={w.title} required /></label>
                <label>Category{sel("category", CATEGORIES, w.category)}</label>
                <label>Max price (₹)<input name="max_price_inr" inputMode="numeric" defaultValue={w.max_price_inr ?? ""} /></label>
                <label>Edition / variant<input name="edition" defaultValue={w.edition ?? ""} /></label>
                <label>Min condition{sel("min_condition", CONDITIONS, w.min_condition)}</label>
                <label className="full">Note to sellers<textarea name="notes" defaultValue={w.notes ?? ""} /></label>
                <label className="full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="active" defaultChecked={w.active} /> Show on public buy-list
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
            <h3>Add to buy-list</h3>
            <form action={newWant} className="grid-form">
              <label className="full">Item<input name="title" required placeholder="e.g. Nintendo 64 consoles" /></label>
              <label>Category{sel("category", CATEGORIES)}</label>
              <label>Max price (₹)<input name="max_price_inr" inputMode="numeric" /></label>
              <label>Edition / variant<input name="edition" /></label>
              <label>Min condition{sel("min_condition", CONDITIONS)}</label>
              <label className="full">Note to sellers<textarea name="notes" /></label>
              <div className="full"><button className="btn accent small">Add</button></div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
