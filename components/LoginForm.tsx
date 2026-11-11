"use client";
import { useActionState, useState } from "react";
import { login } from "@/app/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null as null | { error?: string });
  const [user, setUser] = useState("");
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="next" value={next} />
      <label>Username<input name="user" autoComplete="username" required value={user} onChange={(e) => setUser(e.target.value)} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <div className="error">{state.error}</div>}
      <button className="btn accent" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
