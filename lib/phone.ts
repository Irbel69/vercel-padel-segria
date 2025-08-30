// Small phone utilities used by client and tests.
// normalizePhone: remove common separators and ensure leading + when present
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  const s = String(phone).trim();
  // Keep leading + if present, then strip non-digits
  if (s.startsWith('+')) {
    return '+' + s.slice(1).replace(/[^0-9]/g, '');
  }
  // If it starts with 00, convert to +
  if (s.startsWith('00')) {
    return '+' + s.slice(2).replace(/[^0-9]/g, '');
  }
  // Otherwise remove separators and return as-is (no +)
  return s.replace(/[^0-9]/g, '');
}

// Very small E.164-like check (leading + and 6-15 digits). Use on normalized strings.
export function isE164(normalized: string): boolean {
  return /^\+\d{6,15}$/.test(normalized);
}

export default { normalizePhone, isE164 };
