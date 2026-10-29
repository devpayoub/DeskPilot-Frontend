#!/usr/bin/env node
/**
 * Guard against secrets reaching the browser bundle.
 *
 * Next.js inlines every `NEXT_PUBLIC_*` value into the JavaScript it ships to the
 * browser, at build time, in plain text. That is a one-way door: once a secret is
 * named `NEXT_PUBLIC_ANYTHING` it is public, forever, in every cached copy of the
 * bundle. No amount of "we meant to remove it" fixes that.
 *
 * The rule is a convention until something enforces it, so this script does.
 *
 *   node scripts/check-public-env.mjs
 *
 * Exits 1 on a violation, so it can gate a build or CI step.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** A `NEXT_PUBLIC_` name that looks like it carries a secret. */
const SECRET_NAME = /(KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|PRIVATE|AUTH)/i;

/** Names that match the pattern above but are demonstrably not secrets. */
const ALLOWED = new Set([
  // Public by design: the browser needs it to open the socket, and the ticket is
  // minted per run server-side. See apps/agent/ws_tokens.py.
  "NEXT_PUBLIC_WS_URL",
]);

const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (EXTENSIONS.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];

for (const file of walk(SRC)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    const names = line.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? [];
    for (const name of names) {
      if (!SECRET_NAME.test(name) || ALLOWED.has(name)) continue;
      violations.push({ file: relative(ROOT, file), line: index + 1, name });
    }
  });
}

if (violations.length > 0) {
  console.error("Refusing to ship a secret-looking NEXT_PUBLIC_ variable:\n");
  for (const { file, line, name } of violations) {
    console.error(`  ${file}:${line}  ${name}`);
  }
  console.error(
    "\nAnything prefixed NEXT_PUBLIC_ is inlined into the browser bundle in plain text.",
  );
  console.error(
    "Keep the value server-side (no prefix) and read it through the BFF, or add it",
  );
  console.error("to ALLOWED in scripts/check-public-env.mjs with a written reason.\n");
  process.exit(1);
}

console.log("public env check: no secret-looking NEXT_PUBLIC_ variables.");
