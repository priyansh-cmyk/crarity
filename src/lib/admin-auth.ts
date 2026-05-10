import { supabase } from "@/integrations/supabase/client";

// Whitelist of admin emails — add more here as needed
const ADMIN_EMAILS = ["priyansh@crarity.com"];

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
    return { ok: false, error: "Access denied — this account is not an admin." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: error?.message || "Invalid credentials" };
  }

  return { ok: true };
}

export async function adminLogout() {
  await supabase.auth.signOut();
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase().trim() ?? "";
  return ADMIN_EMAILS.includes(email);
}

export async function getAdminSession(): Promise<{ userId: string; email: string | null } | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const email = user.email?.toLowerCase().trim() ?? "";
  if (!ADMIN_EMAILS.includes(email)) return null;
  return { userId: user.id, email: user.email ?? null };
}
