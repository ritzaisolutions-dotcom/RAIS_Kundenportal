import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, user };
}

export async function getUserRole(userId: string) {
  const supabase = await createClient();
  const portal = supabase.schema("portal");
  const [adminRes, clientRes] = await Promise.all([
    portal.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    portal.from("client_users").select("client_id").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    isAdmin: Boolean(adminRes.data),
    clientId: clientRes.data?.client_id ?? null,
  };
}
