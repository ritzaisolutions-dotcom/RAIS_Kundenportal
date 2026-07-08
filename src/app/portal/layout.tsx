import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requirePortalUser } from "@/lib/portal-queries";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { supabase, clientId, isAdmin } = await requirePortalUser();
  if (isAdmin) redirect("/admin");
  if (!clientId) redirect("/login");

  const { data: client } = await supabase.schema("portal").from("clients").select("name,logo_path").eq("id", clientId).single();

  return (
    <AppShell
      title={client?.name ?? "Kundenportal"}
      subtitle="Ihre Status-Reports und offenen Input-Anfragen"
      links={[
        { href: "/portal/reports", label: "Status-Reports" },
        { href: "/portal/inputs", label: "Input-Anfragen" },
      ]}
      logoUrl={client?.logo_path ?? null}
    >
      {children}
    </AppShell>
  );
}
