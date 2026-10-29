import { z } from "zod";

/**
 * Server-side environment contract.
 *
 * This module is imported by `proxy.ts`, which does not run with the
 * `react-server` condition, so `server-only` cannot be used here (it would throw
 * at import time). The runtime guard below gives the same protection: importing
 * this from a Client Component fails loudly instead of leaking a secret.
 */
if (typeof window !== "undefined") {
  throw new Error("lib/env must only be imported from server code.");
}
const schema = z.object({
  API_BASE_URL: z.url({ message: "API_BASE_URL must be an absolute URL" }),
  APP_URL: z.url({ message: "APP_URL must be an absolute URL" }),
});

const parsed = schema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
  APP_URL: process.env.APP_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration — ${issues}. See .env.example.`);
}

export const env = {
  apiBaseUrl: parsed.data.API_BASE_URL.replace(/\/$/, ""),
  appUrl: parsed.data.APP_URL.replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production",
} as const;
