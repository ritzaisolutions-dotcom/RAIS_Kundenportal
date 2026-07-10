import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormSchemaField } from "@/lib/types";

export type PortalCapabilities = {
  canViewReports: boolean;
  canViewInputs: boolean;
};

export function resolvePortalHome(capabilities: PortalCapabilities) {
  if (capabilities.canViewReports) return "/portal/reports";
  if (capabilities.canViewInputs) return "/portal/inputs";
  return "/portal/no-access";
}

export async function requirePortalUser() {
  const supabase = await createClient();
  const portal = supabase.schema("portal");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminRow) {
    return {
      supabase,
      user,
      clientId: null as string | null,
      isAdmin: true,
      canViewReports: true,
      canViewInputs: true,
    };
  }

  const { data: clientUser } = await portal
    .from("client_users")
    .select("client_id,can_view_reports,can_view_inputs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!clientUser) redirect("/login");
  return {
    supabase,
    user,
    clientId: clientUser.client_id as string,
    isAdmin: false,
    canViewReports: Boolean(clientUser.can_view_reports),
    canViewInputs: Boolean(clientUser.can_view_inputs),
  };
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const portal = supabase.schema("portal");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) redirect("/portal");
  return { supabase, user };
}

export async function getPortalClient(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase.schema("portal").from("clients").select("*").eq("id", clientId).single();
  return data;
}

export function parseFormSchema(input: unknown): FormSchemaField[] {
  if (!Array.isArray(input)) return [];
  const parsedFields = input
    .map((field) => {
      if (!field || typeof field !== "object") return null;
      const entry = field as Record<string, unknown>;
      const type = typeof entry.type === "string" ? entry.type : "text";
      if (!["text", "textarea", "email", "select", "date", "file"].includes(type)) return null;
      const fieldType = type as FormSchemaField["type"];
      return {
        key: String(entry.key ?? ""),
        label: String(entry.label ?? ""),
        type: fieldType,
        required: Boolean(entry.required),
        options: Array.isArray(entry.options) ? entry.options.map((option) => String(option)) : undefined,
      } satisfies FormSchemaField;
    });
  return parsedFields.filter((field) => Boolean(field && field.key && field.label)) as FormSchemaField[];
}

export async function getReportForClient(id: string, clientId: string) {
  const supabase = await createClient();
  const portal = supabase.schema("portal");
  const { data } = await portal
    .from("status_reports")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("status", "published")
    .maybeSingle();
  if (!data) notFound();
  return data;
}

export async function getInputRequestForClient(id: string, clientId: string) {
  const supabase = await createClient();
  const portal = supabase.schema("portal");
  const { data } = await portal
    .from("input_requests")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .in("status", ["open", "submitted", "accepted", "reopened"])
    .maybeSingle();
  if (!data) notFound();
  return data;
}
