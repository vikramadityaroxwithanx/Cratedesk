import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { baseUrlFrom, config } from "@/lib/config";
import { inr } from "@/lib/format";
import {
  STATUSES, createListing, createWant, getListing, listListings, listOffers, listWants,
  priceHistory, updateListing, verdict, type Listing,
} from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true });

const inrInt = z.number().int().nonnegative();

const listingShape = {
  title: z.string().min(2).describe("Short item name, e.g. 'Super Nintendo (SNES) console, PAL, boxed'"),
  platform: z.string().optional().describe("Console family, e.g. SNES, N64, PS1, Mega Drive, Game Boy"),
  region: z.enum(["PAL", "NTSC-U", "NTSC-J", "Unknown"]).optional(),
  condition: z.enum(["Mint", "Excellent", "Good", "Fair", "For parts"]).optional(),
  completeness: z.enum(["Sealed", "Complete in box", "Boxed, incomplete", "Loose"]).optional(),
  price_inr: inrInt.optional().describe("Seller's asking price in INR"),
  fair_low_inr: inrInt.optional().describe("Your estimate of the low end of a fair Indian market price, INR"),
  fair_high_inr: inrInt.optional().describe("Your estimate of the high end of a fair Indian market price, INR"),
  source: z.string().optional().describe("Where it is listed: OLX, Instagram, Facebook Marketplace, eBay, Quikr, WhatsApp group, shop…"),
  source_url: z.string().optional().describe("Link to the original listing, if known"),
  seller: z.string().optional(),
  location: z.string().optional().describe("City of the seller"),
  claude_notes: z.string().optional().describe("Your assessment: red flags, what to ask the seller, how it compares to fair value"),
};

function summarize(l: Listing, base: string) {
  const v = verdict(l);
  return [
    `#${l.id} ${l.title}`,
    `  ${[l.platform, l.region, l.condition, l.completeness].filter(Boolean).join(" · ")}`,
    `  Asking ${inr(l.price_inr)} | fair ${inr(l.fair_low_inr)}–${inr(l.fair_high_inr)}${v ? ` → ${v.label}` : ""}`,
    `  Status: ${l.status}${l.max_bid_inr ? ` | max bid ${inr(l.max_bid_inr)}` : ""}${l.my_notes ? ` | owner notes: ${l.my_notes}` : ""}`,
    `  ${base}/listing/${l.id}`,
  ].join("\n");
}

function buildServer(base: string) {
  const server = new McpServer({ name: "RetroRadar", version: "0.1.0" });

  server.registerTool(
    "add_listing",
    {
      title: "Add listing to board",
      description:
        "Save a retro console or game listing the collector is considering to their RetroRadar board. " +
        "Extract details from the URL, screenshot or text the user gives you, and estimate a fair price range " +
        "for the Indian second-hand market (INR) before calling. The app tracks price history and lets the collector edit it.",
      inputSchema: listingShape,
    },
    async (args) => {
      const row = await createListing(args, "claude");
      return text(`Added to the board.\n\n${summarize(row, base)}\n\nBoard: ${base}/`);
    },
  );

  server.registerTool(
    "update_listing",
    {
      title: "Update a listing",
      description:
        "Update a listing on the board, e.g. a new asking price (this is logged to price history), a status change, or new notes.",
      inputSchema: {
        id: z.number().int().describe("Listing id from get_board"),
        ...Object.fromEntries(Object.entries(listingShape).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()])),
        status: z.enum(STATUSES).optional(),
        max_bid_inr: inrInt.optional().describe("The most the collector will pay"),
        price_note: z.string().optional().describe("Why the price changed, e.g. 'seller dropped price'"),
      },
    },
    async (args) => {
      const { id, price_note, ...rest } = args as { id: number; price_note?: string } & Record<string, unknown>;
      const row = await updateListing(id, rest, "claude", price_note);
      if (!row) return fail(`No listing #${id}. Call get_board to see ids.`);
      return text(`Updated.\n\n${summarize(row, base)}`);
    },
  );

  server.registerTool(
    "get_board",
    {
      title: "Read the board",
      description:
        "Read the collector's saved listings with prices, fair ranges, verdicts, status and the collector's own notes and edits. " +
        "Use this before advising on what to buy, or to find a listing id.",
      inputSchema: {
        status: z.enum(STATUSES).optional(),
        listing_id: z.number().int().optional().describe("Return one listing with its full price history"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ status, listing_id }) => {
      if (listing_id) {
        const l = await getListing(listing_id);
        if (!l) return fail(`No listing #${listing_id}.`);
        const hist = await priceHistory(listing_id);
        const h = hist.map((p) => `  ${new Date(p.recorded_at).toISOString().slice(0, 10)} ${inr(p.price_inr)} (${p.actor}${p.note ? `: ${p.note}` : ""})`);
        return text(`${summarize(l, base)}\n\nClaude's notes: ${l.claude_notes ?? "—"}\n\nPrice history:\n${h.join("\n") || "  none"}`);
      }
      const rows = await listListings(status);
      if (!rows.length) return text(`The board is empty${status ? ` for status "${status}"` : ""}. Board: ${base}/`);
      return text(`${rows.length} listing(s):\n\n${rows.map((r) => summarize(r, base)).join("\n\n")}`);
    },
  );

  server.registerTool(
    "add_want",
    {
      title: "Add to public want-list",
      description:
        "Add an item the collector is hunting for to their PUBLIC want-list page, where sellers can submit offers without an account.",
      inputSchema: {
        title: z.string().min(2).describe("What they want, e.g. 'Nintendo 64 with Expansion Pak'"),
        platform: z.string().optional(),
        region: z.enum(["PAL", "NTSC-U", "NTSC-J", "Any"]).optional(),
        min_condition: z.enum(["Mint", "Excellent", "Good", "Fair", "Any"]).optional(),
        max_price_inr: inrInt.optional().describe("Budget ceiling in INR, shown publicly"),
        notes: z.string().optional().describe("Public note to sellers, e.g. 'must include original controller'"),
      },
    },
    async (args) => {
      const w = await createWant(args, "claude");
      return text(`Added "${w.title}" to the public want-list (max ${inr(w.max_price_inr)}).\nShare this link with sellers: ${base}/w/${config.handle}`);
    },
  );

  server.registerTool(
    "get_offers",
    {
      title: "Read seller offers",
      description:
        "Read offers that sellers submitted on the collector's public want-list, so you can compare them against the budget and fair value.",
      inputSchema: { status: z.enum(["new", "accepted", "declined"]).optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const [offers, wants] = await Promise.all([listOffers({ status }), listWants()]);
      if (!offers.length) return text(`No offers yet. Want-list: ${base}/w/${config.handle}`);
      const budget = new Map(wants.map((w) => [w.id, w.max_price_inr]));
      return text(
        offers
          .map((o) => `Offer #${o.id} for "${o.want_title}" from ${o.seller_name} (${o.contact}): ${inr(o.price_inr)} vs budget ${inr(budget.get(o.want_id))}; condition ${o.condition ?? "—"}; status ${o.status}${o.message ? `\n  "${o.message}"` : ""}`)
          .join("\n\n") + `\n\nManage offers: ${base}/wants`,
      );
    },
  );

  return server;
}

async function handle(req: Request) {
  const server = buildServer(baseUrlFrom(req.headers));
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: each request is independent (serverless-friendly)
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
