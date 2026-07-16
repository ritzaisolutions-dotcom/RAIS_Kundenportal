import { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_SUBMISSION_FILE_BYTES,
  MAX_SUBMISSION_TOTAL_BYTES,
  SUBMISSION_EXTENSIONS,
  SUBMISSION_MIME_TYPES,
  validateUploadedFile,
} from "@/lib/upload-validation";

export async function cleanupCustomerRequestFiles(supabase: SupabaseClient, filePaths: string[]) {
  if (!filePaths.length) return;
  await supabase.storage.from("customer-requests").remove(filePaths);
}

export async function uploadCustomerRequestAttachments(
  supabase: SupabaseClient,
  clientId: string,
  requestKey: string,
  files: File[],
) {
  const filePaths: string[] = [];
  const validationErrors: string[] = [];
  let totalUploadedBytes = 0;

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const uploadValidationError = validateUploadedFile(file, {
      maxBytes: MAX_SUBMISSION_FILE_BYTES,
      allowedMimeTypes: SUBMISSION_MIME_TYPES,
      allowedExtensions: SUBMISSION_EXTENSIONS,
    });
    if (uploadValidationError) {
      validationErrors.push(`Datei "${file.name}": ${uploadValidationError}`);
      continue;
    }

    totalUploadedBytes += file.size;
    if (totalUploadedBytes > MAX_SUBMISSION_TOTAL_BYTES) {
      validationErrors.push("Gesamtgröße aller Anhänge überschreitet das erlaubte Limit.");
      continue;
    }

    const filePath = `${clientId}/${requestKey}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("customer-requests").upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      validationErrors.push(`Upload fehlgeschlagen: ${file.name}`);
    } else {
      filePaths.push(filePath);
    }
  }

  return { filePaths, validationErrors };
}

export function fileNameFromStoragePath(path: string) {
  const base = path.split("/").pop() ?? path;
  const dashIdx = base.indexOf("-");
  return dashIdx >= 0 ? base.slice(dashIdx + 1) : base;
}
