import Link from "next/link";
import { logout } from "@/app/actions";
import { config } from "@/lib/config";

export function Nav() {
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo">Retro<span>Radar</span></Link>
        <nav className="links">
          <Link href="/">Board</Link>
          <Link href="/wants">Want-list &amp; offers</Link>
          <Link href={`/w/${config.handle}`} target="_blank">Public page ↗</Link>
          <Link href="/connect">Connect Claude</Link>
        </nav>
        <form action={logout}><button className="btn ghost small">Log out</button></form>
      </div>
    </header>
  );
}
