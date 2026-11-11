import Link from "next/link";
import { logout } from "@/app/actions";
import { config } from "@/lib/config";
import { Logo } from "./Logo";

export function Nav() {
  return (
    <header className="top">
      <div className="wrap">
        <Logo />
        <nav className="links">
          <Link href="/">Pipeline</Link>
          <Link href="/wants">Buy-list &amp; offers</Link>
          <Link href={`/buy/${config.handle}`} target="_blank">Public page ↗</Link>
          <Link href="/connect">Connect Claude</Link>
        </nav>
        <span className="muted" style={{ whiteSpace: "nowrap" }}>{config.business}</span>
        <form action={logout}><button className="btn ghost small">Log out</button></form>
      </div>
    </header>
  );
}
