"use client";

export default function UsersError({ reset }: { error: Error; reset: () => void }) {
  return <section className="notice"><h1>Не вдалося завантажити Users</h1><p>Перевірте підключення до Supabase та права поточної сесії.</p><button onClick={reset}>Спробувати ще раз</button></section>;
}
