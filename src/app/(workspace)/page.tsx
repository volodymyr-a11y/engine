import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  await requireUser();
  return <><span className="eyebrow">РОБОЧИЙ ПРОСТІР</span><h1>Огляд</h1><p>Користувачі, організації та люди вашої команди.</p><div className="grid">
    <Link className="card" href="/users"><h2>Users</h2><p>Ваш обліковий запис і стан управління доступом.</p></Link>
    <Link className="card" href="/organisations"><h2>Organisations</h2><p>Розділ організацій. Очікує підключення даних.</p></Link>
    <Link className="card" href="/people"><h2>People</h2><p>Розділ людей. Очікує підключення даних.</p></Link>
  </div></>;
}
