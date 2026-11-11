import { STATUSES } from "@/lib/statuses";
import type { Listing } from "@/lib/repo";

const opt = (vals: string[], current?: string | null) => (
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
      <label className="full">Title<input name="title" required defaultValue={l?.title ?? ""} /></label>
      <label>Platform<input name="platform" defaultValue={l?.platform ?? ""} placeholder="SNES, N64, PS1…" /></label>
      <label>Region<select name="region" defaultValue={l?.region ?? ""}>{opt(["PAL", "NTSC-U", "NTSC-J", "Unknown"], l?.region)}</select></label>
      <label>Condition<select name="condition" defaultValue={l?.condition ?? ""}>{opt(["Mint", "Excellent", "Good", "Fair", "For parts"], l?.condition)}</select></label>
      <label>Completeness<select name="completeness" defaultValue={l?.completeness ?? ""}>{opt(["Sealed", "Complete in box", "Boxed, incomplete", "Loose"], l?.completeness)}</select></label>
      <label>Asking price (₹)<input name="price_inr" inputMode="numeric" defaultValue={l?.price_inr ?? ""} /></label>
      <label>My max bid (₹)<input name="max_bid_inr" inputMode="numeric" defaultValue={l?.max_bid_inr ?? ""} /></label>
      <label>Fair price — low (₹)<input name="fair_low_inr" inputMode="numeric" defaultValue={l?.fair_low_inr ?? ""} /></label>
      <label>Fair price — high (₹)<input name="fair_high_inr" inputMode="numeric" defaultValue={l?.fair_high_inr ?? ""} /></label>
      <label>Status<select name="status" defaultValue={l?.status ?? "watching"}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
      <label>Source<input name="source" defaultValue={l?.source ?? ""} placeholder="OLX, Instagram, eBay…" /></label>
      <label>Seller<input name="seller" defaultValue={l?.seller ?? ""} /></label>
      <label>Location<input name="location" defaultValue={l?.location ?? ""} /></label>
      <label className="full">Listing URL<input name="source_url" defaultValue={l?.source_url ?? ""} /></label>
      <label className="full">Claude&apos;s assessment<textarea name="claude_notes" defaultValue={l?.claude_notes ?? ""} /></label>
      <label className="full">My notes<textarea name="my_notes" defaultValue={l?.my_notes ?? ""} placeholder="e.g. Seller open to ₹13k if I pick up in person" /></label>
      <div className="full"><button className="btn accent">{submit}</button></div>
    </form>
  );
}
