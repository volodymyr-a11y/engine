import { getSupabaseConfig } from "@/lib/supabase/config";
import { GoogleButton } from "./google-button";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="login"><section className="card">
    <span className="eyebrow">ENGINE</span><h1>Робочий простір</h1>
    <p>Увійдіть, щоб відкрити користувачів, організації та людей.</p>
    {error && <p role="alert">{error === "logout" ? "Не вдалося вийти. Спробуйте ще раз." : "Вхід не завершено. Спробуйте увійти через Google ще раз."}</p>}
    {getSupabaseConfig() ? <GoogleButton /> : <p role="status">Вхід ще не налаштовано. Адміністратор має підключити Supabase для цього середовища.</p>}
  </section></main>;
}
