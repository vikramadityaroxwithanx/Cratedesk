import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ActorBadge, VerdictBadge } from "@/components/Badges";
import { StatusSelect } from "@/components/StatusSelect";
import { quickStatus } from "./actions";
import { STATUSES, listListings, listOffers, recentActivity, verdict } from "@/lib/repo";
import { inr, when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Board({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [all, activity, offers] = await Promise.all([listListings(), recentActivity(10), listOffers({ status: "new" })]);
  const rows = status ? all.filter((l) => l.status === status) : all;
  const open = all.filter((l) => l.status !== "bought" && l.status !== "passed");
  const deals = open.filter((l) => verdict(l)?.key === "deal").length;
  const spent = all.filter((l) => l.status === "bought").reduce((s, l) => s + (l.price_inr ?? 0), 0);

  return (
    <>
      <Nav />
      <main className="wrap">
        <div className="spread">
          <div>
            <h1>Sourcing board</h1>
            <p className="sub">Listings your Claude found and priced. Edit anything — your changes are what Claude sees next time.</p>
          </div>
          <Link href="/listing/new" className="btn ghost">+ Add manually</Link>
        </div>

        <div className="stats">
          <div className="panel stat"><div className="k">Tracking</div><div className="v">{open.length}</div></div>
          <div className="panel stat"><div className="k">Below market</div><div className="v" style={{ color: "var(--deal)" }}>{deals}</div></div>
          <div className="panel stat"><div className="k">New seller offers</div><div className="v">{offers.length}</div></div>
          <div className="panel stat"><div className="k">Spent</div><div className="v">{inr(spent)}</div></div>
        </div>

        <div className="layout-2">
          <section>
            <div className="row" style={{ marginBottom: 14 }}>
              <Link href="/" className={`btn small ${status ? "ghost" : ""}`}>All ({all.length})</Link>
              {STATUSES.map((s) => {
                const n = all.filter((l) => l.status === s).length;
                return (
                  <Link key={s} href={`/?status=${s}`} className={`btn small ${status === s ? "" : "ghost"}`}>
                    {s[0].toUpperCase() + s.slice(1)} ({n})
                  </Link>
                );
              })}
            </div>

            {rows.length === 0 ? (
              <div className="empty">
                <p><strong>Nothing here yet.</strong></p>
                <p>In Claude, try: <em>“Here’s an OLX listing for a boxed SNES — add it to my RetroRadar board and tell me if it’s fairly priced.”</em></p>
                <Link href="/connect" className="btn accent small">How to connect Claude</Link>
              </div>
            ) : (
              <div className="grid">
                {rows.map((l) => (
                  <article key={l.id} className="card">
                    <div className="spread">
                      <h3><Link href={`/listing/${l.id}`}>{l.title}</Link></h3>
                      <VerdictBadge l={l} />
                    </div>
                    <div className="chips">
                      {[l.platform, l.region, l.condition, l.completeness, l.location].filter(Boolean).map((c) => <span key={c} className="chip">{c}</span>)}
                    </div>
                    <div className="spread" style={{ alignItems: "baseline" }}>
                      <div className="price">{inr(l.price_inr)}</div>
                      <div className="fair">fair {inr(l.fair_low_inr)}–{inr(l.fair_high_inr)}</div>
                    </div>
                    {l.my_notes && <div className="note mine">{l.my_notes}</div>}
                    {!l.my_notes && l.claude_notes && <div className="note">{l.claude_notes.length > 140 ? l.claude_notes.slice(0, 140) + "…" : l.claude_notes}</div>}
                    <div className="spread" style={{ alignItems: "center" }}>
                      <div className="row" style={{ gap: 6 }}>
                        <ActorBadge actor={l.created_by} />
                        {l.source && <span className="muted">{l.source}</span>}
                      </div>
                      <StatusSelect id={l.id} value={l.status} action={quickStatus} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="panel">
            <h2 style={{ marginTop: 0 }}>Activity</h2>
            {activity.length === 0 ? <p className="muted">No activity yet.</p> : (
              <ul className="feed">
                {activity.map((a) => (
                  <li key={a.id}>
                    <ActorBadge actor={a.actor} short />
                    <span>{a.action} <span className="muted">{a.detail}</span> <span className="muted">· {when(a.created_at)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
