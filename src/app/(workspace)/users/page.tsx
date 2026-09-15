import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { IdentityAccessError, IdentityUnavailableError, listIdentityAccounts } from "@/lib/identity";

export const dynamic = "force-dynamic";

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q } = await searchParams;
  try {
    const accounts = await listIdentityAccounts(q);
    return <><span className="eyebrow">ДОСТУП</span><div className="page-heading"><h1>Users</h1><Link className="secondary button-link" href="/users/profile">Мій профіль</Link></div><p>Identity-акаунти Supabase Auth. Це не записи CRM People.</p>
      <form className="search" action="/users"><label htmlFor="user-search">Пошук за email або іменем</label><div><input id="user-search" name="q" defaultValue={q ?? ""} /><button>Шукати</button></div></form>
      {accounts.length === 0 ? <section className="notice"><h2>Нічого не знайдено</h2><p>Спробуйте інший запит або перевірте, чи користувач уже виконав перший вхід.</p></section> : <div className="account-list">{accounts.map((account) => <Link className="card account" key={account.id} href={`/users/${account.id}`}><div><h2>{account.display_name || account.email || "Без імені"}</h2><p>{account.email || "Email недоступний"}</p></div><div className="roles">{account.roles.map((role) => <span key={role}>{role}</span>)}</div></Link>)}</div>}
    </>;
  } catch (error) {
    if (error instanceof IdentityUnavailableError) return <Unavailable />;
    if (error instanceof IdentityAccessError) return <OwnAccount email={user.email} id={user.id} />;
    throw error;
  }
}

function OwnAccount({ email, id }: { email?: string; id: string }) { return <><span className="eyebrow">ДОСТУП</span><div className="page-heading"><h1>Users</h1><Link className="secondary button-link" href="/users/profile">Мій профіль</Link></div><section className="card"><h2>Ваш обліковий запис</h2><dl><dt>Email</dt><dd>{email ?? "Не вказано"}</dd><dt>ID</dt><dd>{id}</dd></dl></section><section className="notice"><h2>Потрібна роль адміністратора</h2><p>Лише користувач із наявною роллю <code>app_admin</code> може переглядати інші identity-акаунти та керувати їхніми ролями.</p></section></>; }
function Unavailable() { return <><span className="eyebrow">ДОСТУП</span><div className="page-heading"><h1>Users</h1><Link className="secondary button-link" href="/users/profile">Мій профіль</Link></div><section className="notice"><h2>Модель identity ще не застосована</h2><p>Застосуйте міграцію <code>20260914000000_identity_accounts.sql</code>, а потім призначте одному вже наявному Auth-акаунту роль <code>app_admin</code>.</p></section></>; }
