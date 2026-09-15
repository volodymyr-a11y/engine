"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireIdentityAdmin } from "@/lib/identity";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) { const result = formData.get(key); if (typeof result !== "string" || !result) throw new Error("Некоректні дані форми."); return result; }

export async function assignRole(formData: FormData) {
  const userId = value(formData, "userId"); const roleKey = value(formData, "roleKey"); const supabase = await requireIdentityAdmin();
  const { data: roles, error: rolesError } = await supabase.rpc("list_identity_roles");
  if (rolesError || !((roles ?? []) as Array<{ key: string }>).some((role) => role.key === roleKey)) redirect(`/users/${userId}?error=role`);
  const { error } = await supabase.rpc("assign_identity_role", { target_user_id: userId, target_role_key: roleKey });
  if (error) redirect(`/users/${userId}?error=assign`);
  revalidatePath("/users"); revalidatePath(`/users/${userId}`); redirect(`/users/${userId}?notice=assigned`);
}

export async function revokeRole(formData: FormData) {
  const userId = value(formData, "userId"); const roleKey = value(formData, "roleKey"); const supabase = await requireIdentityAdmin();
  const { error } = await supabase.rpc("revoke_identity_role", { target_user_id: userId, target_role_key: roleKey });
  if (error) redirect(`/users/${userId}?error=revoke`);
  revalidatePath("/users"); revalidatePath(`/users/${userId}`); redirect(`/users/${userId}?notice=revoked`);
}

export async function updateDisplayName(formData: FormData) {
  const displayName = formData.get("displayName");
  if (typeof displayName !== "string" || displayName.trim().length > 120) redirect("/users/profile?error=name");
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("identity_profiles").update({ display_name: displayName.trim() || null }).eq("id", user.id);
  if (error) redirect("/users/profile?error=save");
  revalidatePath("/users"); revalidatePath("/users/profile"); revalidatePath(`/users/${user.id}`); redirect("/users/profile?notice=saved");
}
