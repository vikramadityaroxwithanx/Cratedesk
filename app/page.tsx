import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ActorBadge, VerdictBadge } from "@/components/Badges";
import { StatusSelect } from "@/components/StatusSelect";
import { quickStatus } from "./actions";
import { CATEGORIES, STATUSES, assess, listListings, listOffers, recentActivity } from "@/lib/repo";
import { config } from "@/lib/config";
import { inr, when } from "@/lib/format";

export const dynamic = "force-dynamic";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default async function Pipeline({ searchParams }: { searchParams: Promise<{ status?: string; category?: string }> }) {
  const { status, category } = await searchParams;
  const [all, activity, offers] = await Promise.all([listListings(), recentActivity(10), listOffers({ status: "new" })]);
  const inCat = category ? all.filter((l) => l.category === category) : all;
  const rows = status ? inCat.filter((l) => l.status === status) : inCat;
  const open = all.filter((l) => l.status !== "bought" && l.status !== "passed");
  const upside = open.reduce((s, l) => s + Math.max(0, assess(l)?.marginInr ?? 0), 0);
  const buys = open.filter((l) => assess(l)?.key === "deal").length;
  const bought = all.filter((l) => l.status === "bought");
  const spent = bought.reduce((s, l) => s + (l.price_inr ?? 0), 0);
  const q = (p: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ category, status, ...p }).filter(([, v]) => v) as [string, string][]);
    const s = sp.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <>
      <Nav />
      <main className="wrap">
        <div className="spread">
          <div>
            <h1>Sourcing pipeline</h1>
            <p className="sub">Stock you might buy, identified and priced by your Claude. Margins are checked against your {Math.round(config.targetMargin * 100)}% target.</p>
          </div>
          <Link href="/listing/new" className="btn ghost">+ Add lead manually</Link>
        </div>

        <div className="stats">
          <div className="panel stat"><div className="k">Open leads</div><div className="v">{open.length}</div></div>
          <div className="panel stat"><div className="k">Hit target margin</div><div className="v" style={{ color: "var(--deal)" }}>{buys}</div></div>
          <div className="panel stat"><div className="k">Margin in pipeline</div><div className="v">{inr(upside)}</div></div>
          <div className="panel stat"><div className="k">Bought · new offers</div><div className="v">{inr(spent)} · {offers.length}</div></div>
        </div>

        <div className="layout-2">
          <section>
            <div className="row" style={{ marginBottom: 10 }}>
              <Link href={q({ category: undefined })} className={`btn small ${category ? "ghost" : ""}`}>All categories</Link>
              {CATEGORIES.map((c) => (
                <Link key={c} href={q({ category: c })} className={`btn small ${category === c ? "" : "ghost"}`}>{c} ({all.filter((l) => l.category === c).length})</Link>
              ))}
            </div>
            <div className="row" style={{ marginBottom: 16, gap: 8 }}>
              <Link href={q({ status: undefined })} className={`chip ${status ? "" : "on"}`}>All ({inCat.length})</Link>
              {STATUSES.map((s) => (
                <Link key={s} href={q({ status: s })} className={`chip ${status === s ? "on" : ""}`}>{cap(s)} ({inCat.filter((l) => l.status === s).length})</Link>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="empty">
                <p><strong>No leads here yet.</strong></p>
                <p>In Claude, try: <em>“Here’s an OLX listing for a boxed SNES at ₹9,000 — add it to my CrateDesk pipeline and tell me if it’s worth buying for resale.”</em></p>
                <Link href="/connect" className="btn accent small">How to connect Claude</Link>
              </div>
            ) : (
              <div className="grid">
                {rows.map((l) => {
                  const a = assess(l);
                  return (
                    <article key={l.id} className="card">
                      <div className="spread">
                        <span className="cat">{l.category ?? "Uncategorised"}</span>
                        <VerdictBadge l={l} />
                      </div>
                      <h3><Link href={`/listing/${l.id}`}>{l.title}</Link></h3>
                      <div className="chips">
                        {[l.edition, l.condition, l.includes, l.location].filter(Boolean).map((c) => <span key={c} className="chip">{c}</span>)}
                      </div>
                      <div className="spread" style={{ alignItems: "baseline" }}>
                        <div><div className="k">Asking</div><div className="price">{inr(l.price_inr)}</div></div>
                        <div style={{ textAlign: "right" }}>
                          <div className="k">Resale</div>
                          <div className="fair">{inr(l.fair_low_inr)}–{inr(l.fair_high_inr)}</div>
                          {a && <div className="fair">max buy {inr(a.maxBuy)}</div>}
                        </div>
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
                  );
                })}
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
