import Link from "next/link";

export function Logo({ light = false, size = 18 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" className="logo" style={{ fontSize: size, color: light ? "#fff" : undefined }}>
      Crate<span>Desk</span>
    </Link>
  );
}
