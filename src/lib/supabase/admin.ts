import { createClient } from "@supabase/supabase-js";
import { getPrivateEnv } from "@/lib/env";

export function createAdminClient() {
  const privateEnv = getPrivateEnv();
  return createClient(privateEnv.NEXT_PUBLIC_SUPABASE_URL, privateEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
