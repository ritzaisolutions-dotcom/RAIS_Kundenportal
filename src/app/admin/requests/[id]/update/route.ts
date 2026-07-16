import { NextResponse } from "next/server";
import { ADMIN_STATUS_TRANSITIONS } from "@/lib/customer-request-status";
import { mutationSucceeded } from "@/lib/mutation-result";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CustomerRequestStatus } from "@/lib/types";

const CLOSED_STATUSES = new Set<CustomerRequestStatus>(["rejected", "completed"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url), { status: 303 });

  const { data: customerRequest } = await portal.from("customer_requests").select("id,status").eq("id", id).maybeSingle();
  if (!customerRequest) {
    return NextResponse.redirect(new URL("/admin/requests?error=Anfrage+nicht+gefunden", request.url), { status: 303 });
  }

  const currentStatus = customerRequest.status as CustomerRequestStatus;
  const formData = await request.formData();
  const newStatusRaw = String(formData.get("new_status") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "").trim();

  const newStatus = newStatusRaw ? (newStatusRaw as CustomerRequestStatus) : null;

  if (!newStatus && !bodyMd) {
    return NextResponse.redirect(new URL(`/admin/requests/${id}?error=Bitte+Status+ändern+oder+Nachricht+eingeben.`, request.url), {
      status: 303,
    });
  }

  if (newStatus && newStatus !== currentStatus && !ADMIN_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
    return NextResponse.redirect(new URL(`/admin/requests/${id}?error=Statusübergang+nicht+erlaubt.`, request.url), {
      status: 303,
    });
  }

  if (newStatus && newStatus !== currentStatus) {
    const updatePayload: { status: CustomerRequestStatus; closed_at?: string | null } = { status: newStatus };
    if (CLOSED_STATUSES.has(newStatus)) {
      updatePayload.closed_at = new Date().toISOString();
    } else {
      updatePayload.closed_at = null;
    }

    const { data: updatedRows, error: updateError } = await portal
      .from("customer_requests")
      .update(updatePayload)
      .eq("id", id)
      .eq("status", currentStatus)
      .select("id");

    if (!mutationSucceeded(updatedRows, updateError)) {
      return NextResponse.redirect(new URL(`/admin/requests/${id}?error=Status+konnte+nicht+aktualisiert+werden.`, request.url), {
        status: 303,
      });
    }

    const { error: eventError } = await portal.from("customer_request_events").insert({
      request_id: id,
      kind: "status_change",
      author_role: "admin",
      author_id: user.id,
      body_md: bodyMd || null,
      new_status: newStatus,
    });

    if (eventError) {
      return NextResponse.redirect(new URL(`/admin/requests/${id}?error=Status-Event+konnte+nicht+gespeichert+werden.`, request.url), {
        status: 303,
      });
    }

    if (bodyMd) {
      return NextResponse.redirect(new URL(`/admin/requests/${id}?success=Aktualisiert`, request.url), { status: 303 });
    }

    return NextResponse.redirect(new URL(`/admin/requests/${id}?success=Status+aktualisiert`, request.url), { status: 303 });
  }

  if (bodyMd) {
    const { error: messageError } = await portal.from("customer_request_events").insert({
      request_id: id,
      kind: "message",
      author_role: "admin",
      author_id: user.id,
      body_md: bodyMd,
    });

    if (messageError) {
      return NextResponse.redirect(new URL(`/admin/requests/${id}?error=Nachricht+konnte+nicht+gespeichert+werden.`, request.url), {
        status: 303,
      });
    }
  }

  return NextResponse.redirect(new URL(`/admin/requests/${id}?success=Antwort+gesendet`, request.url), { status: 303 });
}
