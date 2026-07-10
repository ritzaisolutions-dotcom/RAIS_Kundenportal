import { redirect } from "next/navigation";
import { requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";

export default async function PortalPage() {
  const { canViewReports, canViewInputs } = await requirePortalUser();
  redirect(resolvePortalHome({ canViewReports, canViewInputs }));
}
