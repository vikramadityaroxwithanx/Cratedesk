import { headers } from "next/headers";
import Link from "next/link";
import { baseUrlFrom, config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Connect() {
  const base = baseUrlFrom(await headers());
  const mcp = `${base}/api/mcp`;
  return (
    <main className="wrap" style={{ maxWidth: 780 }}>
      <p><Link href="/" className="logo">Crate<span>Desk</span></Link></p>
      <h1>Connect your Claude</h1>
      <p className="sub">CrateDesk has no AI inside. Your team&apos;s own Claude identifies items, spots fakes and estimates resale value; CrateDesk keeps the pipeline, margins, price history and your public buy-list live.</p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="muted">MCP server URL</div>
        <div className="code" style={{ fontSize: 16, display: "block", padding: "10px 12px", marginTop: 6 }}>{mcp}</div>
      </div>

      <ol className="steps panel">
        <li>In Claude (web or desktop), open <strong>Settings → Connectors</strong> (also under <strong>Customize → Connectors</strong>).</li>
        <li>Click <strong>Add custom connector</strong>. Name it <code>CrateDesk</code> and paste the URL above. No OAuth needed. Click <strong>Add</strong>.</li>
        <li>In a new chat, open the tools menu and make sure <strong>CrateDesk</strong> is switched on.</li>
        <li>Try: <em>“Someone on OLX in Pune is selling a boxed PAL Super Nintendo with 2 controllers for ₹9,000. Add it to my CrateDesk pipeline and tell me if it&apos;s worth buying for resale.”</em> You can also paste a screenshot or a photo of a record sleeve.</li>
        <li>Open the <Link href="/">pipeline</Link> — the lead is there with its margin. Edit it; ask Claude to <em>“review my pipeline”</em> and it sees your edits.</li>
      </ol>

      <h2>What Claude can do</h2>
      <table className="panel">
        <tbody>
          <tr><td><code>add_lead</code></td><td>Save an item to buy, with Claude&apos;s identification, resale range and risk notes</td></tr>
          <tr><td><code>update_lead</code></td><td>Change asking price (logged to history), status, estimate or notes</td></tr>
          <tr><td><code>delete_lead</code></td><td>Delete a lead you no longer want</td></tr>
          <tr><td><code>get_pipeline</code></td><td>Read leads, computed margins and your team&apos;s edits</td></tr>
          <tr><td><code>add_to_buylist</code></td><td>Add an item to your public “We&apos;re buying” page</td></tr>
          <tr><td><code>get_offers</code></td><td>Read offers sellers sent from your buy-list</td></tr>
        </tbody>
      </table>
      <p className="muted">Demo dealer: {config.business}. Free Claude plans allow one custom connector; Pro and above allow several.</p>
    </main>
  );
}
