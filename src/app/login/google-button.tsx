"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function GoogleButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  async function login() {
    setPending(true);
    setError(false);
    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Missing OAuth URL");
      setRedirectUrl(data.url);
      window.location.assign(data.url);
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return <>
    <button onClick={login} disabled={pending}>{pending ? "Переходимо до Google…" : "Увійти через Google"}</button>
    {redirectUrl && <p><a href={redirectUrl}>Якщо перехід не відбувся, продовжити вхід</a></p>}
    {error && <p role="alert">Не вдалося розпочати вхід. Спробуйте ще раз або зверніться до адміністратора.</p>}
  </>;
}
