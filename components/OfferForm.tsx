"use client";
import { useActionState } from "react";
import { submitOffer } from "@/app/actions";
import { CONDITIONS } from "@/lib/statuses";

export function OfferForm({ wantId }: { wantId: number }) {
  const [state, action, pending] = useActionState(submitOffer, null as null | { ok?: boolean; error?: string });
  if (state?.ok) return <div className="flash">Offer sent. The dealer will contact you directly.</div>;
  return (
    <form action={action} className="grid-form">
      <input type="hidden" name="want_id" value={wantId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />
      <label>Your name<input name="seller_name" required /></label>
      <label>Phone / WhatsApp / email<input name="contact" required /></label>
      <label>Your price (₹)<input name="price_inr" inputMode="numeric" /></label>
      <label>Condition<select name="condition" defaultValue=""><option value="">—</option>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="full">Details (what&apos;s included, city, photos link)<textarea name="message" /></label>
      {state?.error && <div className="full error">{state.error}</div>}
      <div className="full"><button className="btn accent" disabled={pending}>{pending ? "Sending…" : "Send offer"}</button></div>
    </form>
  );
}
