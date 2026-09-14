import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="workspace">
    <header><Link className="brand" href="/">ENGINE</Link><span>{user.email ?? "Обліковий запис"}</span><form action={logout}><button className="secondary">Вийти</button></form></header>
    <nav aria-label="Головна навігація"><Link href="/">Огляд</Link><Link href="/users">Users</Link><Link href="/organisations">Organisations</Link><Link href="/people">People</Link></nav>
    <main className="content">{children}</main>
  </div>;
}
