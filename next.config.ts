import type { NextConfig } from "next";

// Baseline Security-Header (Ship-Audit Finding: next.config.ts hatte bisher
// keinerlei CSP/X-Frame-Options/Referrer-Policy). Erlaubt Supabase (Storage-
// Bilder, API) als einzige externe Quelle, sonst 'self'.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Die Dokument-Generierung liest Branding-Assets (Logos) zur Laufzeit per fs aus
  // docs_vorlagen/05_Branding. Dieser Ordner ist nicht Teil der App und wird von
  // Vercels File-Tracing sonst NICHT mitgebündelt -> in Prod fehlen die Logos.
  // Explizit in die Serverless-Function der Generate-Route einschließen.
  outputFileTracingIncludes: {
    "/admin/documents/**": ["./docs_vorlagen/05_Branding/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
