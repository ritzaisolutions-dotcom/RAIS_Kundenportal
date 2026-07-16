import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requirePortalUser } from "@/lib/portal-queries";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { supabase, clientId, isAdmin, canViewReports, canViewInputs, canSubmitRequests } = await requirePortalUser();
  if (isAdmin) redirect("/admin");
  if (!clientId) redirect("/login");

  const { data: client } = await supabase.schema("portal").from("clients").select("name,logo_path").eq("id", clientId).single();

  const links = [
    ...(canViewReports ? [{ href: "/portal/reports", label: "Reports" }] : []),
    ...(canViewInputs ? [{ href: "/portal/inputs", label: "Aufgaben" }] : []),
    ...(canSubmitRequests ? [{ href: "/portal/requests", label: "Anfragen" }] : []),
  ];

  return (
    <AppShell title={client?.name ?? "Kundenportal"} subtitle="Ihre Reports, Aufgaben und Anfragen" links={links} logoUrl={client?.logo_path ?? null}>
      {children}
    </AppShell>
  );
}
