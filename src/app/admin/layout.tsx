import { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireAdminUser } from "@/lib/portal-queries";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminUser();
  return (
    <AppShell
      title="RAIS Admin"
      subtitle="Kunden, Reports und Input-Anfragen verwalten"
      links={[
        { href: "/admin", label: "Kunden" },
        { href: "/admin/clients/new", label: "Neuer Kunde" },
      ]}
    >
      {children}
    </AppShell>
  );
}
