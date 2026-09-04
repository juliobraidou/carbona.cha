/**
 * Shared field validation, used by both the contact and the checkout action.
 *
 * It lives in `lib/` rather than being exported from one action and imported
 * by the other: everything a `"use server"` module exports is part of that
 * module's public surface, and helpers have no business being reachable that
 * way. Plain modules are also importable from client components, which is how
 * the CEP mask in the checkout form shares `formatCep` with the server that
 * re-validates it.
 */

/**
 * Deliberately loose. A stricter pattern rejects addresses that are perfectly
 * deliverable (quoted locals, new TLDs, plus-addressing edge cases), and the
 * only thing that actually proves an address works is sending to it.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * A Brazilian CEP is eight digits. `00000000` is rejected because it is what
 * an empty masked input collapses to, and it would otherwise sail through as
 * a valid São Paulo postcode.
 */
export function isValidCep(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length === 8 && digits !== "00000000";
}

/** `12345678` → `12345-678`. Leaves partial input alone so typing is not fought. */
export function formatCep(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
