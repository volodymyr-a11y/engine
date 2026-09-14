import Link from "next/link";
import { notFound } from "next/navigation";
import { getIdentityAccount, IdentityAccessError, IdentityUnavailableError } from "@/lib/identity";
import { assignRole, revokeRole } from "../actions";

export const dynamic = "force-dynamic";

export default async function UserDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const [{ id }, state] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  try {
    const { account, roles } = await getIdentityAccount(id); if (!account) notFound();
    return <><Link href="/users">← Users</Link><span className="eyebrow">IDENTITY ACCOUNT</span><h1>{account.display_name || account.email || "Без імені"}</h1><p>{account.email || "Email недоступний"}</p>{state.notice && <p role="status">Зміни ролей збережено.</p>}{state.error && <p role="alert">Зміну ролі не виконано. Перевірте права та спробуйте ще раз.</p>}
      <section className="card"><h2>Профіль</h2><dl><dt>ID</dt><dd>{account.id}</dd><dt>Створено</dt><dd>{new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(account.created_at))}</dd></dl></section>
      <section className="card role-manager"><h2>Ролі</h2><p>Змінюються лише ролі, що вже існують у базі. Видалення акаунтів тут немає.</p>{roles.map((role) => <div className="role-row" key={role.key}><div><strong>{role.key}</strong><span>{role.description}</span></div>{account.roles.includes(role.key) ? <form action={revokeRole}><input type="hidden" name="userId" value={account.id} /><input type="hidden" name="roleKey" value={role.key} /><button className="secondary">Відкликати</button></form> : <form action={assignRole}><input type="hidden" name="userId" value={account.id} /><input type="hidden" name="roleKey" value={role.key} /><button>Призначити</button></form>}</div>)}</section></>;
  } catch (error) {
    if (error instanceof IdentityUnavailableError) return <section className="notice"><h1>Модель identity ще не застосована</h1></section>;
    if (error instanceof IdentityAccessError) return <section className="notice"><h1>Доступ заборонено</h1><p>Для перегляду цього профілю потрібна роль <code>app_admin</code>.</p></section>;
    throw error;
  }
}
