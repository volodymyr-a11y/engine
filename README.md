# Engine

Базовий застосунок на Next.js, TypeScript та App Router.

## Запуск

Потрібен Node.js 20.9 або новіший та npm.

```sh
npm install
npm run dev
```

Відкрийте http://localhost:3000. Стартова сторінка: `src/app/page.tsx`.
Глобальні стилі: `src/app/globals.css`.

## Supabase

Клієнт використовує наявні `NEXT_PUBLIC_SUPABASE_URL` і
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` з `.env.local`.
Фабрику можна викликати в Server Components, Route Handlers і Client Components:

```ts
import { createSupabaseClient } from "@/lib/supabase";

const supabase = createSupabaseClient();
```

На сервері створюйте клієнт для кожного запиту. У Client Components зберігайте
екземпляр між рендерами, наприклад через `useState(createSupabaseClient)`.
Запити до таблиць додавайте через `supabase.from("назва_таблиці")`.
Доступ до даних визначають дозволи та RLS-політики Supabase для ролі `anon`.

Автентифікація, cookies та middleware не налаштовані; збереження сесії,
оновлення токенів і визначення сесії з URL вимкнені.
Використовується встановлений `@supabase/supabase-js`; `@supabase/ssr`
для цього підключення без сесій не потрібний.
Параметри клієнта описані в [документації Supabase](https://supabase.com/docs/reference/javascript/initializing).

## Перевірка та production

```sh
npm run typecheck
npm run build
npm start
```
