/**
 * Brazilian phone helpers. We mask 10-digit (landline) and 11-digit (mobile)
 * numbers; the unmasked value (digits only or `+E.164`) is what we send to the
 * backend so the formatting concern stays in the UI layer.
 */

const DIGIT_RE = /\D+/g;

export function digitsOnly(value: string): string {
  return value.replace(DIGIT_RE, '');
}

/** Pretty-prints a Brazilian phone with parens + dash. */
export function formatBRPhone(value: string): string {
  const d = digitsOnly(value);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/** True when digits-only length is 10 (landline) or 11 (mobile). */
export function isValidBRPhone(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 10 || d.length === 11;
}
