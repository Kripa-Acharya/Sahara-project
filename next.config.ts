import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 * - 'unsafe-inline' for script/style is required by Next.js inline runtime
 *   and Tailwind's style injection; nonce-based CSP is a roadmap hardening.
 * - 'unsafe-eval' is needed only by React Fast Refresh in development.
 * - No external hosts: the app is fully self-contained (fonts are bundled
 *   by next/font, images are local or data:).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
  experimental: {
    serverActions: {
      // Uploads go through Server Actions; documents are capped at 5 MB in
      // validation, so 8 MB covers multipart overhead while bounding requests.
      bodySizeLimit: "8mb",
      // Behind a reverse proxy, set ALLOWED_ORIGINS (comma-separated hosts) so
      // Next's Server-Action origin/host CSRF check matches the public name.
      ...(process.env.ALLOWED_ORIGINS
        ? { allowedOrigins: process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) }
        : {}),
    },
  },
};

export default nextConfig;
