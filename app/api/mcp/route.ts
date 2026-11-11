import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { baseUrlFrom, config } from "@/lib/config";
import { inr } from "@/lib/format";
import {
  CATEGORIES, CONDITIONS, STATUSES, assess, createListing, createWant, findDuplicateLeads, getListing, listListings,
  listOffers, listWants, priceHistory, updateListing, type Listing,
} from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true });

const inrInt = z.number().int().nonnegative();
const category = z.enum(CATEGORIES).describe("Retro gaming = consoles, cartridges, handhelds; Vinyl = records; Trading cards = Pokémon, cricket, etc.");

const leadShape = {
  category,
  title: z.string().min(2).describe("Short item name, e.g. 'Super Nintendo console, PAL, boxed' or 'Pink Floyd – The Wall, 1979 UK 2LP'"),
  edition: z.string().optional().describe("Variant that drives value: region (PAL/NTSC-J), pressing (1st UK press), set/edition (Base Set 1st Ed.)"),
  condition: z.enum(CONDITIONS).optional(),
  includes: z.string().optional().describe("What's included: box, manuals, controllers, inner sleeves, grading slab…"),
  price_inr: inrInt.optional().describe("Seller's asking price in INR"),
  fair_low_inr: inrInt.optional().describe("Your estimate of the LOW end of what the dealer could resell it for in India, INR"),
  fair_high_inr: inrInt.optional().describe("Your estimate of the HIGH end of what the dealer could resell it for in India, INR"),
  source: z.string().optional().describe("Where it's offered: OLX, Instagram, Facebook Marketplace, estate sale, walk-in, WhatsApp group…"),
  source_url: z.string().optional(),
  seller: z.string().optional(),
  location: z.string().optional().describe("Seller's city"),
  claude_notes: z.string().optional().describe("Your assessment: authenticity/red flags, condition questions to ask, comparable sales"),
};

function summarize(l: Listing, base: string) {
  const a = assess(l);
  return [
    `#${l.id} [${l.category ?? "Uncategorised"}] ${l.title}`,
    `  ${[l.edition, l.condition, l.includes].filter(Boolean).join(" · ")}`,
    `  Asking ${inr(l.price_inr)} | resale ${inr(l.fair_low_inr)}–${inr(l.fair_high_inr)}${a ? ` → ${a.label} (${inr(a.marginInr)}); max buy at target margin ${inr(a.maxBuy)}` : ""}`,
    `  Status: ${l.status}${l.target_buy_inr ? ` | dealer's target buy ${inr(l.target_buy_inr)}` : ""}${l.my_notes ? ` | dealer notes: ${l.my_notes}` : ""}`,
    `  ${base}/listing/${l.id}`,
  ].join("\n");
}

function buildServer(base: string) {
  const server = new McpServer({ name: config.brand, version: "0.2.0" });
  const target = `${Math.round(config.targetMargin * 100)}%`;

  server.registerTool(
    "add_lead",
    {
      title: "Add sourcing lead",
      description:
        `Save an item the dealer (${config.business}) might buy for resale to their ${config.brand} sourcing pipeline. ` +
        "Read the URL, screenshot, photo or text the user gives you; identify the exact item and edition; estimate a realistic " +
        `Indian resale range in INR; and note authenticity or condition risks before calling. The app computes margin vs the dealer's ${target} target. ` +
        "If the same listing is already open in the pipeline, nothing is saved and the existing lead is returned: use update_lead for it, or set allow_duplicate only if it is genuinely a second unit.",
      inputSchema: {
        ...leadShape,
        allow_duplicate: z.boolean().optional().describe("Set true only when the dealer confirms this is a separate unit, not the same listing"),
      },
    },
    async ({ allow_duplicate, ...args }) => {
      if (!allow_duplicate) {
        const dupes = await findDuplicateLeads(args);
        if (dupes.length) {
          return text(
            `Not added: this looks like a lead that's already open in the pipeline.\n\n${dupes.map((d) => summarize(d, base)).join("\n\n")}\n\n` +
            "Use update_lead with that id to change price, status or notes. If it really is a separate unit, call add_lead again with allow_duplicate: true.",
          );
        }
      }
      const row = await createListing(args, "claude");
      return text(`Added to the pipeline.\n\n${summarize(row, base)}\n\nPipeline: ${base}/`);
    },
  );

  server.registerTool(
    "update_lead",
    {
      title: "Update a lead",
      description: "Update a lead: new asking price (logged to price history), status, resale estimate or notes.",
      inputSchema: {
        id: z.number().int().describe("Lead id from get_pipeline"),
        ...Object.fromEntries(Object.entries(leadShape).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()])),
        status: z.enum(STATUSES).optional(),
        target_buy_inr: inrInt.optional().describe("The most the dealer will pay"),
        price_note: z.string().optional().describe("Why the price changed, e.g. 'seller countered'"),
      },
    },
    async (args) => {
      const { id, price_note, ...rest } = args as { id: number; price_note?: string } & Record<string, unknown>;
      const row = await updateListing(id, rest, "claude", price_note);
      if (!row) return fail(`No lead #${id}. Call get_pipeline to see ids.`);
      return text(`Updated.\n\n${summarize(row, base)}`);
    },
  );

  server.registerTool(
    "get_pipeline",
    {
      title: "Read the sourcing pipeline",
      description:
        "Read the dealer's sourcing leads with asking prices, resale estimates, computed margins, status and the dealer's own edits and notes. " +
        "Use before advising what to buy or to find a lead id.",
      inputSchema: {
        status: z.enum(STATUSES).optional(),
        category: category.optional(),
        lead_id: z.number().int().optional().describe("Return one lead with its full price history"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ status, category, lead_id }) => {
      if (lead_id) {
        const l = await getListing(lead_id);
        if (!l) return fail(`No lead #${lead_id}.`);
        const hist = await priceHistory(lead_id);
        const h = hist.map((p) => `  ${new Date(p.recorded_at).toISOString().slice(0, 10)} ${inr(p.price_inr)} (${p.actor}${p.note ? `: ${p.note}` : ""})`);
        return text(`${summarize(l, base)}\n\nClaude's notes: ${l.claude_notes ?? "—"}\n\nPrice history:\n${h.join("\n") || "  none"}`);
      }
      const rows = await listListings({ status, category });
      if (!rows.length) return text(`No leads${status || category ? " matching that filter" : ""}. Pipeline: ${base}/`);
      return text(`${rows.length} lead(s), target margin ${target}:\n\n${rows.map((r) => summarize(r, base)).join("\n\n")}`);
    },
  );

  server.registerTool(
    "add_to_buylist",
    {
      title: "Add to public buy-list",
      description:
        `Add an item the dealer wants to acquire to their PUBLIC "We're buying" page, where collectors and sellers submit offers without an account.`,
      inputSchema: {
        category,
        title: z.string().min(2).describe("What the dealer is buying, e.g. 'Nintendo 64 consoles' or 'Bollywood OST LPs, 1970s'"),
        edition: z.string().optional(),
        min_condition: z.enum(CONDITIONS).optional(),
        max_price_inr: inrInt.optional().describe("Max the dealer will pay per item, INR (shown publicly)"),
        notes: z.string().optional().describe("Public note to sellers, e.g. 'working units only, original controllers preferred'"),
      },
    },
    async (args) => {
      const w = await createWant(args, "claude");
      return text(`Added "${w.title}" to the public buy-list (up to ${inr(w.max_price_inr)}).\nShare: ${base}/buy/${config.handle}`);
    },
  );

  server.registerTool(
    "get_offers",
    {
      title: "Read seller offers",
      description:
        "Read offers that sellers submitted on the dealer's public buy-list page, to compare against the max price and estimated resale value.",
      inputSchema: { status: z.enum(["new", "accepted", "declined"]).optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const [offers, wants] = await Promise.all([listOffers({ status }), listWants()]);
      if (!offers.length) return text(`No offers yet. Buy-list: ${base}/buy/${config.handle}`);
      const cap = new Map(wants.map((w) => [w.id, w.max_price_inr]));
      return text(
        offers
          .map((o) => `Offer #${o.id} for "${o.want_title}" from ${o.seller_name} (${o.contact}): ${inr(o.price_inr)} vs max ${inr(cap.get(o.want_id))}; condition ${o.condition ?? "—"}; status ${o.status}${o.message ? `\n  "${o.message}"` : ""}`)
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
