import assert from "node:assert/strict";
import test from "node:test";
import {
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  MAX_LOGO_BYTES,
  SUBMISSION_EXTENSIONS,
  SUBMISSION_MIME_TYPES,
  validateUploadedFile,
} from "@/lib/upload-validation";

function createFile(contents: string, name: string, type: string) {
  return new File([contents], name, { type });
}

test("validateUploadedFile accepts valid image file", () => {
  const file = createFile("ok", "logo.png", "image/png");
  const result = validateUploadedFile(file, {
    maxBytes: MAX_LOGO_BYTES,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  });
  assert.equal(result, null);
});

test("validateUploadedFile rejects invalid extension", () => {
  const file = createFile("ok", "logo.exe", "image/png");
  const result = validateUploadedFile(file, {
    maxBytes: MAX_LOGO_BYTES,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  });
  assert.equal(result, "Dateiendung ist nicht erlaubt.");
});

test("validateUploadedFile rejects oversized file", () => {
  const oversized = new File([new Uint8Array(MAX_LOGO_BYTES + 1)], "logo.png", { type: "image/png" });
  const result = validateUploadedFile(oversized, {
    maxBytes: MAX_LOGO_BYTES,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  });
  assert.match(result ?? "", /Datei ist zu groß/);
});

test("validateUploadedFile rejects unsupported submission mime type", () => {
  const file = createFile("payload", "report.pdf", "application/x-msdownload");
  const result = validateUploadedFile(file, {
    maxBytes: MAX_LOGO_BYTES,
    allowedMimeTypes: SUBMISSION_MIME_TYPES,
    allowedExtensions: SUBMISSION_EXTENSIONS,
  });
  assert.equal(result, "Dateityp ist nicht erlaubt.");
});
