import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { redirect } from "next/navigation";
import {
  CUSTOMER_REQUEST_STATUS_CHIP,
  CUSTOMER_REQUEST_STATUS_LABEL,
} from "@/lib/customer-request-status";
import { fileNameFromStoragePath } from "@/lib/customer-request-upload";
import { getCustomerRequestForClient, requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";
import { CustomerRequestAuthorRole, CustomerRequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ACCEPT_SUBMISSION_FILES } from "@/lib/upload-validation";

type RequestEvent = {
  id: string;
  kind: string;
  author_role: CustomerRequestAuthorRole;
  body_md: string | null;
  new_status: string | null;
  attachment_paths: string[] | null;
  created_at: string;
};

async function signedAttachmentUrls(
  supabase: Awaited<ReturnType<typeof requirePortalUser>>["supabase"],
  paths: string[],
) {
  const urls = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from("customer-requests").createSignedUrl(path, 3600);
      return { path, url: data?.signedUrl ?? null, name: fileNameFromStoragePath(path) };
    }),
  );
  return urls.filter((entry) => entry.url);
}

export default async function PortalRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const { supabase, clientId, canViewReports, canViewInputs, canSubmitRequests } = await requirePortalUser();
  if (!canSubmitRequests) {
    redirect(resolvePortalHome({ canViewReports, canViewInputs, canSubmitRequests }));
  }

  const request = await getCustomerRequestForClient(id, clientId!);
  const status = request.status as CustomerRequestStatus;
  const portal = supabase.schema("portal");

  const { data: events } = await portal
    .from("customer_request_events")
    .select("id,kind,author_role,body_md,new_status,attachment_paths,created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const requestAttachments = await signedAttachmentUrls(supabase, request.attachment_paths ?? []);
  const canReply = status === "revision";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/portal/requests" className="text-sm text-grey-500 hover:text-grey-900">
          ← Zurück
        </Link>
        <span className={`chip ${CUSTOMER_REQUEST_STATUS_CHIP[status] ?? "chip-neutral"}`}>
          {CUSTOMER_REQUEST_STATUS_LABEL[status] ?? request.status}
        </span>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
        <h2 className="text-2xl">{request.subject}</h2>
        <p className="text-sm text-grey-500">
          {request.category} · {request.area} · {request.project_name}
        </p>
        <p className="text-xs text-grey-500">Eingereicht am {formatDate(request.created_at)}</p>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">{request.description_md}</div>

        {requestAttachments.length ? (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Anhänge</p>
            <ul className="space-y-1">
              {requestAttachments.map((attachment) => (
                <li key={attachment.path}>
                  <a href={attachment.url!} className="text-primary-dark text-sm underline" target="_blank" rel="noreferrer">
                    {attachment.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {(events as RequestEvent[] | null)?.length ? (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-grey-900">Verlauf</h3>
          {(events as RequestEvent[]).map((event) => (
            <EventBlock key={event.id} event={event} supabase={supabase} />
          ))}
        </div>
      ) : null}

      {resolvedSearch.success ? (
        <div className="portal-success-banner" role="status">
          <span className="portal-success-banner-icon" aria-hidden="true">
            ✓
          </span>
          <p className="portal-success-banner-text">{resolvedSearch.success}</p>
        </div>
      ) : null}

      {canReply ? (
        <form
          action={`/portal/requests/${id}/reply`}
          method="post"
          encType="multipart/form-data"
          className="bg-surface border border-border rounded-lg p-6 space-y-4"
        >
          <h3 className="font-semibold">Ergänzung senden</h3>
          <p className="text-sm text-grey-600">RAIS hat Rückfragen. Bitte ergänzen Sie Ihre Anfrage.</p>
          <div>
            <label htmlFor="body_md" className="block text-sm mb-1">
              Ihre Ergänzung
            </label>
            <textarea id="body_md" name="body_md" rows={6} required />
          </div>
          <div>
            <label htmlFor="attachments" className="block text-sm mb-1">
              Weitere Anhänge (optional)
            </label>
            <input id="attachments" name="attachments" type="file" accept={ACCEPT_SUBMISSION_FILES} multiple />
          </div>
          {resolvedSearch.error ? <p className="text-sm text-red-600">{resolvedSearch.error}</p> : null}
          <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
            Ergänzung übermitteln
          </button>
        </form>
      ) : null}
    </section>
  );
}

async function EventBlock({
  event,
  supabase,
}: {
  event: RequestEvent;
  supabase: Awaited<ReturnType<typeof requirePortalUser>>["supabase"];
}) {
  const attachments = await signedAttachmentUrls(supabase, event.attachment_paths ?? []);
  const isAdmin = event.author_role === "admin";
  const statusLabel =
    event.new_status && event.new_status in CUSTOMER_REQUEST_STATUS_LABEL
      ? CUSTOMER_REQUEST_STATUS_LABEL[event.new_status as CustomerRequestStatus]
      : event.new_status;

  return (
    <article className={`rounded-lg border p-4 ${isAdmin ? "border-primary/30 bg-primary-light/20" : "border-border"}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium">{isAdmin ? "RAIS" : "Sie"}</p>
        <p className="text-xs text-grey-500">{formatDate(event.created_at)}</p>
      </div>
      {event.kind === "status_change" && statusLabel ? (
        <p className="text-sm text-grey-600 mb-2">Status geändert: {statusLabel}</p>
      ) : null}
      {event.body_md ? (
        <div className="prose prose-sm max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{event.body_md}</Markdown>
        </div>
      ) : null}
      {attachments.length ? (
        <ul className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <li key={attachment.path}>
              <a href={attachment.url!} className="text-primary-dark text-sm underline" target="_blank" rel="noreferrer">
                {attachment.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
