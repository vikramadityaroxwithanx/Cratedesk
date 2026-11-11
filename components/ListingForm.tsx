import { CATEGORIES, CONDITIONS, STATUSES } from "@/lib/statuses";
import type { Listing } from "@/lib/repo";

const opt = (vals: readonly string[], current?: string | null) => (
  <>
    <option value="">—</option>
    {vals.map((v) => <option key={v} value={v}>{v}</option>)}
    {current && !vals.includes(current) && <option value={current}>{current}</option>}
  </>
);

export function ListingForm({ l, action, submit }: { l?: Listing | null; action: (f: FormData) => Promise<void>; submit: string }) {
  return (
    <form action={action} className="grid-form">
      {l && <input type="hidden" name="id" value={l.id} />}
      <label className="full">Item<input name="title" required defaultValue={l?.title ?? ""} /></label>
      <label>Category<select name="category" defaultValue={l?.category ?? ""}>{opt(CATEGORIES, l?.category)}</select></label>
      <label>Edition / variant<input name="edition" defaultValue={l?.edition ?? ""} placeholder="PAL · 1st UK press · 1st Edition" /></label>
      <label>Condition<select name="condition" defaultValue={l?.condition ?? ""}>{opt(CONDITIONS, l?.condition)}</select></label>
      <label>Includes<input name="includes" defaultValue={l?.includes ?? ""} placeholder="Box, manual, 2 controllers" /></label>
      <label>Asking price (₹)<input name="price_inr" inputMode="numeric" defaultValue={l?.price_inr ?? ""} /></label>
      <label>My target buy price (₹)<input name="target_buy_inr" inputMode="numeric" defaultValue={l?.target_buy_inr ?? ""} /></label>
      <label>Resale value — low (₹)<input name="fair_low_inr" inputMode="numeric" defaultValue={l?.fair_low_inr ?? ""} /></label>
      <label>Resale value — high (₹)<input name="fair_high_inr" inputMode="numeric" defaultValue={l?.fair_high_inr ?? ""} /></label>
      <label>Status<select name="status" defaultValue={l?.status ?? "new"}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
      <label>Source<input name="source" defaultValue={l?.source ?? ""} placeholder="OLX, Instagram, estate sale, walk-in…" /></label>
      <label>Seller<input name="seller" defaultValue={l?.seller ?? ""} /></label>
      <label>Location<input name="location" defaultValue={l?.location ?? ""} /></label>
      <label className="full">Listing URL<input name="source_url" defaultValue={l?.source_url ?? ""} /></label>
      <label className="full">Claude&apos;s assessment<textarea name="claude_notes" defaultValue={l?.claude_notes ?? ""} /></label>
      <label className="full">Dealer notes<textarea name="my_notes" defaultValue={l?.my_notes ?? ""} placeholder="e.g. Seller will do ₹9k for cash pickup" /></label>
      <div className="full"><button className="btn accent">{submit}</button></div>
    </form>
  );
}
