import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="logo" style={{ fontSize: 26, marginBottom: 6 }}>Crate<span>Desk</span></div>
      <p className="sub">The buying desk for collectibles dealers. Your Claude identifies and prices stock; CrateDesk runs the pipeline.</p>
      <div className="panel"><LoginForm next={next ?? "/"} /></div>
      <p className="muted" style={{ marginTop: 16 }}>Reviewer? Use the test login from the submission. <a href="/connect">How to connect Claude →</a></p>
    </main>
  );
}
