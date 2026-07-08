"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ReportEditorFormProps = {
  clientId: string;
  action: string;
};

export function ReportEditorForm({ clientId, action }: ReportEditorFormProps) {
  const [body, setBody] = useState("");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadMessage("Bitte zuerst ein Bild auswählen.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("image", file);
    setIsUploading(true);
    setUploadMessage(null);

    try {
      const response = await fetch(`/admin/clients/${clientId}/reports/upload-image`, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "Upload fehlgeschlagen." }))) as { error?: string };
        setUploadMessage(payload.error ?? "Upload fehlgeschlagen.");
        return;
      }

      const payload = (await response.json()) as { markdown: string };
      setBody((current) => `${current}${current.endsWith("\n") || current.length === 0 ? "" : "\n"}${payload.markdown}\n`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadMessage("Bild hochgeladen und als Markdown eingefügt.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={action} method="post" className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm mb-1" htmlFor="title">
          Titel
        </label>
        <input id="title" name="title" required />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm mb-1" htmlFor="body_editor">
            Inhalt (Markdown)
          </label>
          <textarea
            id="body_editor"
            rows={18}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            className="font-mono text-sm"
          />
          <input type="hidden" id="body_md" name="body_md" value={body} />
        </div>

        <div>
          <p className="block text-sm mb-1">Live-Preview</p>
          <div className="border border-border rounded-lg p-4 min-h-[26rem] bg-white prose prose-stone max-w-none overflow-auto">
            <Markdown remarkPlugins={[remarkGfm]}>{body || "_Noch kein Inhalt_"}</Markdown>
          </div>
        </div>
      </div>

      <div className="space-y-2 border border-border rounded-lg p-4">
        <p className="text-sm font-medium">Bilder für den Report</p>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input ref={fileInputRef} name="image" type="file" accept="image/*" className="max-w-sm" />
          <button type="button" onClick={handleUpload} disabled={isUploading} className="bg-white border border-border rounded-lg px-3 py-2 text-sm">
            {isUploading ? "Lade hoch..." : "Bild hochladen"}
          </button>
        </div>
        <p className="text-xs text-muted">Beim Upload wird automatisch `![Bild](storage:&lt;pfad&gt;)` in den Markdown-Inhalt eingefügt.</p>
        {uploadMessage ? <p className="text-sm text-muted">{uploadMessage}</p> : null}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue="draft">
          <option value="draft">Entwurf</option>
          <option value="published">Veröffentlicht</option>
        </select>
      </div>

      <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
        Report speichern
      </button>
    </form>
  );
}
