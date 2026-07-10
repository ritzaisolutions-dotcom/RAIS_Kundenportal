import { createAdminClient } from "@/lib/supabase/admin";

type RollbackTargets = {
  userId?: string | null;
  clientId?: string | null;
  logoPath?: string | null;
};

export function rollbackSuffix(cleanupErrors: string[]) {
  return cleanupErrors.length ? "+(Rollback+teilweise+fehlgeschlagen)" : "";
}

export async function rollbackOnboardingArtifacts({ userId, clientId, logoPath }: RollbackTargets) {
  const admin = createAdminClient();
  const errors: string[] = [];

  if (userId) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) errors.push(`auth-user:${error.message}`);
  }

  if (clientId) {
    const { error } = await admin.schema("portal").from("clients").delete().eq("id", clientId);
    if (error) errors.push(`client:${error.message}`);
  }

  if (logoPath) {
    const { error } = await admin.storage.from("logos").remove([logoPath]);
    if (error) errors.push(`logo:${error.message}`);
  }

  return { errors };
}
