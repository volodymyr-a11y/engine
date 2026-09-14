import { requireUser } from "@/lib/auth";

export default async function People() {
  await requireUser();
  return <><span className="eyebrow">ДОВІДНИК</span><h1>People</h1><section className="notice"><h2>Дані ще не підключено</h2><p>Для списку людей потрібні підтверджена схема та правила доступу. Люди є окремою сутністю; облікові записи входу не використовуються як цей список.</p></section></>;
}
