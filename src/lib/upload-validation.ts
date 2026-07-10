type UploadLimits = {
  maxBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
};

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_REPORT_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SUBMISSION_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB

export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"] as const;

export const SUBMISSION_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ...IMAGE_MIME_TYPES,
] as const;

export const SUBMISSION_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ...IMAGE_EXTENSIONS,
] as const;

export const ACCEPT_IMAGES = IMAGE_EXTENSIONS.join(",");
export const ACCEPT_SUBMISSION_FILES = SUBMISSION_EXTENSIONS.join(",");

function normalizeExtension(fileName: string) {
  const dotIdx = fileName.lastIndexOf(".");
  if (dotIdx < 0) return "";
  return fileName.slice(dotIdx).toLowerCase();
}

export function validateUploadedFile(file: File, limits: UploadLimits) {
  if (!file || file.size === 0) return "Datei ist leer.";
  if (file.size > limits.maxBytes) return `Datei ist zu groß (max. ${Math.floor(limits.maxBytes / (1024 * 1024))} MB).`;

  const mimeType = (file.type || "").toLowerCase();
  if (!limits.allowedMimeTypes.includes(mimeType)) return "Dateityp ist nicht erlaubt.";

  const ext = normalizeExtension(file.name);
  if (!limits.allowedExtensions.includes(ext)) return "Dateiendung ist nicht erlaubt.";

  return null;
}
