import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type IdentityAccount = { id: string; email: string | null; display_name: string | null; created_at: string; roles: string[] };
export type IdentityRole = { key: string; description: string };
export class IdentityUnavailableError extends Error {}
export class IdentityAccessError extends Error {}

function isMissingMigration(error: { code?: string } | null) { return error?.code === "PGRST202" || error?.code === "42P01" || error?.code === "42883"; }

export async function requireIdentityAdmin() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_identity_admin");
  if (error) { if (isMissingMigration(error)) throw new IdentityUnavailableError(); throw new Error("Не вдалося перевірити права доступу."); }
  if (!data) throw new IdentityAccessError();
  return supabase;
}

export async function listIdentityAccounts(search?: string) {
  const supabase = await requireIdentityAdmin();
  const { data, error } = await supabase.rpc("list_identity_accounts", { search: search || null });
  if (error) { if (isMissingMigration(error)) throw new IdentityUnavailableError(); throw new Error("Не вдалося завантажити облікові записи."); }
  return (data ?? []) as IdentityAccount[];
}

export async function getIdentityAccount(id: string) {
  const supabase = await requireIdentityAdmin();
  const [{ data: account, error: accountError }, { data: roles, error: rolesError }] = await Promise.all([
    supabase.rpc("get_identity_account", { target_user_id: id }), supabase.rpc("list_identity_roles"),
  ]);
  if (accountError || rolesError) { const error = accountError ?? rolesError; if (isMissingMigration(error)) throw new IdentityUnavailableError(); throw new Error("Не вдалося завантажити обліковий запис."); }
  return { account: ((account ?? [])[0] ?? null) as IdentityAccount | null, roles: (roles ?? []) as IdentityRole[] };
}

export async function getOwnIdentityProfile() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("identity_profiles").select("display_name").eq("id", user.id).maybeSingle();
  if (error) { if (isMissingMigration(error)) throw new IdentityUnavailableError(); throw new Error("Не вдалося завантажити профіль."); }
  return { user, displayName: data?.display_name ?? "" };
}
