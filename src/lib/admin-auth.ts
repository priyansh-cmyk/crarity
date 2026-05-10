import { supabase } from "@/integrations/supabase/client";

/**
 * Real Supabase admin auth. A user is considered an admin when they have
 * a row in `user_roles` with role = 'admin' (checked via the `has_role`
 * security-definer function used by RLS).
 */

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: error?.message || "Invalid credentials" };
  }

  const isAdmin = await checkIsAdmin(data.user.id);
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { ok: false, error: "Access denied — this account is not an admin." };
  }
  return { ok: true };
}

export async function adminLogout() {
  await supabase.auth.signOut();
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  // Use the security-definer RPC to bypass RLS on user_roles
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("checkIsAdmin error:", error);
    return false;
  }
  return !!data;
}

export async function getAdminSession(): Promise<{ userId: string; email: string | null } | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const ok = await checkIsAdmin(user.id);
  if (!ok) return null;
  return { userId: user.id, email: user.email ?? null };
}
