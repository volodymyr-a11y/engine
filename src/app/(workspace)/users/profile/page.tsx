import Link from "next/link";
import { IdentityUnavailableError, getOwnIdentityProfile } from "@/lib/identity";
import { updateDisplayName } from "../actions";

export const dynamic = "force-dynamic";

type ProfilePageProps = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const state = await searchParams;
  try {
    const { user, displayName } = await getOwnIdentityProfile();
    return <>
      <Link href="/users">← Users</Link>
      <span className="eyebrow">МІЙ ПРОФІЛЬ</span>
      <h1>Профіль</h1>
      <section className="card profile-form">
        <h2>Дані облікового запису</h2>
        <p>Email змінюється у налаштуваннях способу входу.</p>
        <dl><dt>Email</dt><dd>{user.email ?? "Не вказано"}</dd></dl>
        {state.notice === "saved" && <p role="status">Display name збережено.</p>}
        {state.error === "name" && <p role="alert">Display name має містити не більше 120 символів.</p>}
        {state.error === "save" && <p role="alert">Не вдалося зберегти display name. Перевірте підключення та спробуйте ще раз.</p>}
        <form action={updateDisplayName}>
          <label htmlFor="display-name">Display name</label>
          <input id="display-name" name="displayName" defaultValue={displayName} maxLength={120} />
          <p className="field-hint">Це ім’я буде показуватися у списку Users.</p>
          <button type="submit">Зберегти зміни</button>
        </form>
      </section>
    </>;
  } catch (error) {
    if (error instanceof IdentityUnavailableError) return <section className="notice"><h1>Модель identity ще не застосована</h1><p>Застосуйте міграцію <code>20260914000000_identity_accounts.sql</code>, щоб редагувати профіль.</p></section>;
    throw error;
  }
}
