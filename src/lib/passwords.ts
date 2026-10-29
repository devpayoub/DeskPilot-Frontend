/**
 * Client-side password suggestion.
 *
 * Mirrors `apps/organizations/services.py::generate_password` — same alphabet, so
 * a generated password never contains a character that is ambiguous in a
 * proportional font (l/I/1, O/0). It is only a convenience: the server generates
 * and validates its own when the field is left empty, and the server's answer is
 * the one that is actually stored.
 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}
