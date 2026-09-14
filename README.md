# Engine

Next.js App Router / TypeScript з Supabase Auth.

## Запуск

Потрібен Node.js 20.9+.

```sh
npm ci
npm run dev
```

У локальному `.env.local` або середовищі розгортання мають бути наявні
`NEXT_PUBLIC_SUPABASE_URL` і `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Публічні змінні потрібні також під час production build. Не додавайте секретні
ключі до `NEXT_PUBLIC_*` або репозиторію.

## Авторизація

- `/login`: запуск Google OAuth із browser-клієнта (PKCE).
- `/auth/callback`: обмін одноразового коду на cookie-сесію; помилки повертають
  на login. Адреса успішного повернення фіксована (`/`), зовнішній `next` не приймається.
- `src/proxy.ts`: перевірка користувача та оновлення cookies запиту/відповіді;
  відповіді з авторизацією не кешуються.
- Захищені layout і кожна сторінка викликають серверний `requireUser()` через
  `auth.getUser()`. Майбутні серверні запити/мутації теж мають перевіряти доступ.
- Вихід — Server Action через POST із вбудованою перевіркою Origin Next.js;
  завершує поточну сесію, інші пристрої залишаються авторизованими.
- Browser-клієнт: `src/lib/supabase/browser.ts`; серверний клієнт для кожного
  запиту: `src/lib/supabase/server.ts`. Старий `src/lib/supabase.ts` експортує
  лише browser-фабрику для сумісності.

Реалізація дотримується [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Налаштування, потрібні для реального входу

Під час перевірки наявного проєкту `/auth/v1/settings` повернув `google: false`.
У Supabase Dashboard → Authentication → Sign In / Providers увімкніть Google
і налаштуйте Google OAuth Client ID / Secret без передачі секрету в код.
У Google Cloud додайте дозволений callback, показаний у Supabase Dashboard
(зазвичай `https://<project-ref>.supabase.co/auth/v1/callback`).
У Supabase URL Configuration налаштуйте Site URL і дозволені redirect URL:
`http://localhost:3000/auth/callback` та точну production-адресу `/auth/callback`.
Після цього перевірте вхід реальним Google-акаунтом, перезавантаження захищеної
сторінки, оновлення сесії та вихід. Наскрізний OAuth поки не перевірено.

## Users та identity-акаунти

`supabase/migrations/20260914000000_identity_accounts.sql` додає модель
identity для Users: `identity_profiles`, `identity_roles` та
`identity_role_assignments`. Auth-акаунти отримують базову роль `member`.
Адміністратор призначається один раз після входу через SQL Editor:

```sql
insert into public.identity_role_assignments (user_id, role_key)
values ('AUTH_USER_UUID', 'app_admin');
```

Після застосування міграції `/users` дає `app_admin` пошук identity-акаунтів,
перегляд профілю та призначення або відкликання лише наявних ролей. Дії ще раз
перевіряються в серверному коді й security-definer RPC. Немає видалення
акаунтів, довільних назв ролей або зв'язку з CRM People. База не застосовувала
цю міграцію з репозиторію; живу інтеграцію потрібно перевірити після deployment.

## Стан інших розділів даних

Для Organisations і People потрібні фактичні назви таблиць, колонки,
первинні ключі, зв'язки та RLS-політики (міграції або generated database types).
У двох checkout не знайдено SQL/схеми. REST OpenAPI повернув HTTP 401
`Secret API key required`; жодної таблиці або ролі не припущено.
Сторінки явно показують відсутність підключення, не порожній список чи
вигадані дані. People не прирівнюється до Supabase Auth users.
Надайте схему або доступне джерело метаданих; не надсилайте секретні ключі в чат.

## Перевірка

```sh
npm run typecheck
npm run build
npm start
```

Для локальної HTTP-перевірки після build також доступно:

```sh
node scripts/smoke-auth.mjs
```

Без конфігурації `/login` пояснює відсутність налаштування; захищені URL
повертають на login. Некоректний callback повертає безпечну помилку.

Локально пройдено `npm run typecheck`, `npm run build` і
`node scripts/smoke-auth.mjs` (після збірки без Supabase env): сторінка
неналаштованого входу, захист чотирьох маршрутів, помилки callback,
ігнорування зовнішнього redirect та `no-store`.
Перевірка живих settings підтвердила вимкнений Google provider; реальний
OAuth, refresh і вихід авторизованої сесії потребують інтеграційного тесту
після налаштування провайдера.

### Повторна перевірка 2026-09-14

Зміни перенесено до основного checkout. Після `next typegen` перевірка типів
проходить; production build з наявним `.env.local` також проходить.
Локальний сервер на порту 3000 показує Google-вхід; неавторизовані запити
до `/`, `/users`, `/organisations`, `/people` повертають 307 на `/login`;
callback з відмовою повертає 303 на `/login?error=callback`.

За повідомленням користувача Google provider і локальні redirect URLs
налаштовано. Попереднє `google: false` вище — історичний результат першої
перевірки. Повторне читання settings з поточного середовища заблоковане
мережевими дозволами (EACCES).

У браузері кнопка сформувала Google OAuth URL із PKCE S256 і callback
`http://localhost:3000/auth/callback`. Автоматичний перехід і резервне
посилання не відкрили провайдера; прямий перехід у вбудованому браузері
повернув `ERR_BLOCKED_BY_CLIENT`. Додано резервне посилання для ручного
продовження, якщо автоматичне перенаправлення не виконується.

Для завершення smoke test відкрийте `http://localhost:3000/login` у звичайному
браузері, увійдіть через Google, перевірте відкриття огляду та Users,
перезавантажте сторінку, натисніть «Вийти» й повторно відкрийте `/users`.
Успіх реальної OAuth-сесії, її оновлення та виходу поки не підтверджено.

**Актуальний блокер після ручної спроби користувача:** Supabase відповів
`Unsupported provider: provider is not enabled`. У Supabase Dashboard
потрібно вибрати саме проєкт, чий URL задано в Engine, відкрити
Authentication → Sign In / Providers → Google, перевірити Enable Google
provider та зберегти конфігурацію. Наявність redirect URLs сама по собі
не вмикає провайдера. Секрети не потрібно передавати в чат або змінювати
в коді. OAuth smoke test не завершено успішно.

### Users: локальна перевірка 2026-09-14

`npm run typecheck`, `npm run build` та `node scripts/smoke-auth.mjs` пройшли
після додавання Users. Останній тест перевіряє login, захист `/`, `/users`,
`/organisations`, `/people` і безпечний callback. Supabase CLI або локальна база
даних у цьому середовищі недоступні, тому міграція identity не застосована та
права `app_admin`, список і role mutations не перевірені проти живої БД.
