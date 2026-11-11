"use client";
import { STATUSES } from "@/lib/statuses";

export function StatusSelect({ id, value, action }: { id: number; value: string; action: (f: FormData) => Promise<void> }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label="Status">
        {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
      </select>
    </form>
  );
}
