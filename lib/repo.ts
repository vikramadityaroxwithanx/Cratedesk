import { db } from "./db";
import { inr } from "./format";

export type Actor = "claude" | "human";

import { STATUSES } from "./statuses";
export { STATUSES };
export type Status = (typeof STATUSES)[number];

export type Listing = {
  id: number;
  title: string;
  platform: string | null;
  region: string | null;
  condition: string | null;
  completeness: string | null;
  price_inr: number | null;
  fair_low_inr: number | null;
  fair_high_inr: number | null;
  source: string | null;
  source_url: string | null;
  seller: string | null;
  location: string | null;
  claude_notes: string | null;
  my_notes: string | null;
  status: Status;
  max_bid_inr: number | null;
  created_by: Actor;
  last_edited_by: Actor;
  created_at: Date;
  updated_at: Date;
};

export type PricePoint = {
  id: number;
  listing_id: number;
  price_inr: number;
  note: string | null;
  actor: Actor;
  recorded_at: Date;
};

export type Want = {
  id: number;
  title: string;
  platform: string | null;
  region: string | null;
  min_condition: string | null;
  max_price_inr: number | null;
  notes: string | null;
  active: boolean;
  created_by: Actor;
  created_at: Date;
  offer_count?: number;
};

export type Offer = {
  id: number;
  want_id: number;
  want_title?: string;
  seller_name: string;
  contact: string;
  price_inr: number | null;
  condition: string | null;
  message: string | null;
  status: "new" | "accepted" | "declined";
  created_at: Date;
};

const LISTING_FIELDS = [
  "title", "platform", "region", "condition", "completeness", "price_inr", "fair_low_inr",
  "fair_high_inr", "source", "source_url", "seller", "location", "claude_notes", "my_notes",
  "status", "max_bid_inr",
] as const;
export type ListingInput = Partial<Pick<Listing, (typeof LISTING_FIELDS)[number]>>;

const WANT_FIELDS = ["title", "platform", "region", "min_condition", "max_price_inr", "notes", "active"] as const;
export type WantInput = Partial<Pick<Want, (typeof WANT_FIELDS)[number]>>;

function pick<T extends Record<string, unknown>>(obj: T, keys: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

/** Deterministic verdict from the price vs the fair range (no AI in the app). */
export function verdict(l: Pick<Listing, "price_inr" | "fair_low_inr" | "fair_high_inr">) {
  if (l.price_inr == null || l.fair_low_inr == null || l.fair_high_inr == null) return null;
  if (l.price_inr < l.fair_low_inr) return { key: "deal", label: "Below market" } as const;
  if (l.price_inr > l.fair_high_inr) return { key: "high", label: "Above market" } as const;
  return { key: "fair", label: "Fair price" } as const;
}

export async function logActivity(actor: Actor | "seller", action: string, detail?: string) {
  const sql = await db();
  await sql`INSERT INTO activity (actor, action, detail) VALUES (${actor}, ${action}, ${detail ?? null})`;
}

export async function recentActivity(limit = 8) {
  const sql = await db();
  return sql<{ id: number; actor: string; action: string; detail: string | null; created_at: Date }[]>`
    SELECT * FROM activity ORDER BY created_at DESC LIMIT ${limit}`;
}

// ---------- listings ----------

export async function createListing(input: ListingInput & { title: string }, actor: Actor) {
  const sql = await db();
  const data = { ...pick(input, LISTING_FIELDS), created_by: actor, last_edited_by: actor };
  const [row] = await sql<Listing[]>`INSERT INTO listings ${sql(data)} RETURNING *`;
  if (row.price_inr != null) {
    await sql`INSERT INTO price_points (listing_id, price_inr, note, actor)
              VALUES (${row.id}, ${row.price_inr}, ${"First seen"}, ${actor})`;
  }
  await logActivity(actor, "added listing", `#${row.id} ${row.title}`);
  return row;
}

export async function updateListing(id: number, input: ListingInput, actor: Actor, priceNote?: string) {
  const sql = await db();
  const before = await getListing(id);
  if (!before) return null;
  const all = pick(input, LISTING_FIELDS);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(all)) if ((before as Record<string, unknown>)[k] !== v) data[k] = v;
  if (Object.keys(data).length === 0) return before;
  const [row] = await sql<Listing[]>`
    UPDATE listings SET ${sql({ ...data, last_edited_by: actor })}, updated_at = now()
    WHERE id = ${id} RETURNING *`;
  if (data.price_inr != null && data.price_inr !== before.price_inr) {
    await sql`INSERT INTO price_points (listing_id, price_inr, note, actor)
              VALUES (${id}, ${data.price_inr as number}, ${priceNote ?? "Price updated"}, ${actor})`;
  }
  await logActivity(actor, "updated listing", `#${id} ${row.title}: ${Object.keys(data).join(", ").replaceAll("_inr", "").replaceAll("_", " ")}`);
  return row;
}

export async function deleteListing(id: number, actor: Actor) {
  const sql = await db();
  const [row] = await sql<Listing[]>`DELETE FROM listings WHERE id = ${id} RETURNING *`;
  if (row) await logActivity(actor, "removed listing", `#${id} ${row.title}`);
  return row ?? null;
}

export async function getListing(id: number) {
  const sql = await db();
  const [row] = await sql<Listing[]>`SELECT * FROM listings WHERE id = ${id}`;
  return row ?? null;
}

export async function listListings(status?: string) {
  const sql = await db();
  return status
    ? sql<Listing[]>`SELECT * FROM listings WHERE status = ${status} ORDER BY updated_at DESC`
    : sql<Listing[]>`SELECT * FROM listings ORDER BY updated_at DESC`;
}

export async function priceHistory(listingId: number) {
  const sql = await db();
  return sql<PricePoint[]>`SELECT * FROM price_points WHERE listing_id = ${listingId} ORDER BY recorded_at ASC`;
}

export async function addPricePoint(listingId: number, price: number, note: string | null, actor: Actor) {
  const sql = await db();
  await sql`INSERT INTO price_points (listing_id, price_inr, note, actor) VALUES (${listingId}, ${price}, ${note}, ${actor})`;
  await sql`UPDATE listings SET price_inr = ${price}, last_edited_by = ${actor}, updated_at = now() WHERE id = ${listingId}`;
  await logActivity(actor, "logged price", `#${listingId} → ${inr(price)}`);
}

// ---------- wants ----------

export async function createWant(input: WantInput & { title: string }, actor: Actor) {
  const sql = await db();
  const data = { ...pick(input, WANT_FIELDS), created_by: actor };
  const [row] = await sql<Want[]>`INSERT INTO wants ${sql(data)} RETURNING *`;
  await logActivity(actor, "added want", row.title);
  return row;
}

export async function updateWant(id: number, input: WantInput, actor: Actor) {
  const sql = await db();
  const data = pick(input, WANT_FIELDS);
  if (Object.keys(data).length === 0) return getWant(id);
  const [row] = await sql<Want[]>`UPDATE wants SET ${sql(data)} WHERE id = ${id} RETURNING *`;
  if (row) await logActivity(actor, "updated want", row.title);
  return row ?? null;
}

export async function deleteWant(id: number, actor: Actor) {
  const sql = await db();
  const [row] = await sql<Want[]>`DELETE FROM wants WHERE id = ${id} RETURNING *`;
  if (row) await logActivity(actor, "removed want", row.title);
}

export async function getWant(id: number) {
  const sql = await db();
  const [row] = await sql<Want[]>`SELECT * FROM wants WHERE id = ${id}`;
  return row ?? null;
}

export async function listWants(activeOnly = false) {
  const sql = await db();
  return sql<Want[]>`
    SELECT w.*, (SELECT count(*)::int FROM offers o WHERE o.want_id = w.id) AS offer_count
    FROM wants w ${activeOnly ? sql`WHERE w.active` : sql``}
    ORDER BY w.created_at DESC`;
}

// ---------- offers ----------

export async function createOffer(input: Omit<Offer, "id" | "status" | "created_at" | "want_title">) {
  const sql = await db();
  const [row] = await sql<Offer[]>`INSERT INTO offers ${sql(input)} RETURNING *`;
  const want = await getWant(input.want_id);
  await logActivity("seller", "sent offer", `${input.seller_name} → ${want?.title ?? "want"}${input.price_inr ? ` at ${inr(input.price_inr)}` : ""}`);
  return row;
}

export async function listOffers(opts: { wantId?: number; status?: string } = {}) {
  const sql = await db();
  return sql<Offer[]>`
    SELECT o.*, w.title AS want_title FROM offers o JOIN wants w ON w.id = o.want_id
    WHERE true
      ${opts.wantId ? sql`AND o.want_id = ${opts.wantId}` : sql``}
      ${opts.status ? sql`AND o.status = ${opts.status}` : sql``}
    ORDER BY o.created_at DESC`;
}

export async function setOfferStatus(id: number, status: Offer["status"], actor: Actor) {
  const sql = await db();
  const [row] = await sql<Offer[]>`UPDATE offers SET status = ${status} WHERE id = ${id} RETURNING *`;
  if (row) await logActivity(actor, `${status} offer`, `${row.seller_name}`);
  return row ?? null;
}
