import { requireUser } from "@/lib/auth";

export default async function Organisations() {
  await requireUser();
  return <><span className="eyebrow">ДОВІДНИК</span><h1>Organisations</h1><section className="notice"><h2>Дані ще не підключено</h2><p>Для списку організацій потрібна підтверджена схема таблиці та правила доступу. Кількість і записи поки недоступні.</p></section></>;
}
