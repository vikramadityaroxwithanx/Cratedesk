import { headers } from "next/headers";
import Link from "next/link";
import { baseUrlFrom } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Connect() {
  const base = baseUrlFrom(await headers());
  const mcp = `${base}/api/mcp`;
  return (
    <main className="wrap" style={{ maxWidth: 780 }}>
      <p><Link href="/" className="logo">Retro<span>Radar</span></Link></p>
      <h1>Connect your Claude</h1>
      <p className="sub">RetroRadar has no AI inside. Your own Claude does the reading and pricing; RetroRadar keeps the board, the price history and your public want-list live.</p>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="muted">MCP server URL</div>
        <div className="code" style={{ fontSize: 16, display: "block", padding: "10px 12px", marginTop: 6 }}>{mcp}</div>
      </div>

      <ol className="steps panel">
        <li>In Claude (web or desktop), open <strong>Settings → Connectors</strong> (also under <strong>Customize → Connectors</strong>).</li>
        <li>Click <strong>Add custom connector</strong>. Name it <code>RetroRadar</code> and paste the URL above. No OAuth needed. Click <strong>Add</strong>.</li>
        <li>In a new chat, open the tools menu and make sure <strong>RetroRadar</strong> is switched on.</li>
        <li>Try: <em>“Here’s an OLX listing: Super Nintendo PAL, boxed with 2 controllers, ₹14,500, Pune. Add it to my RetroRadar board and tell me if it’s fairly priced.”</em></li>
        <li>Open the <Link href="/">board</Link> — the listing is there. Edit it; ask Claude to <em>“check my board”</em> and it sees your edits.</li>
      </ol>

      <h2>What Claude can do</h2>
      <table className="panel">
        <tbody>
          <tr><td><code>add_listing</code></td><td>Save a listing with Claude&apos;s fair-price estimate and notes</td></tr>
          <tr><td><code>update_listing</code></td><td>Change price (logged to history), status or notes</td></tr>
          <tr><td><code>get_board</code></td><td>Read the board, including your edits and price history</td></tr>
          <tr><td><code>add_want</code></td><td>Add an item to your public want-list</td></tr>
          <tr><td><code>get_offers</code></td><td>Read offers sellers sent from your public page</td></tr>
        </tbody>
      </table>
      <p className="muted">Free Claude plans allow one custom connector; Pro and above allow several.</p>
    </main>
  );
}
