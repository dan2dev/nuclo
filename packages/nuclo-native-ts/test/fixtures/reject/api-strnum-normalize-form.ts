// expect: normalize() takes "NFC", "NFD", "NFKC" or "NFKD" as a literal natively
// code: NUCLO6001
export function norm(s: string, form: string): string {
  return s.normalize(form);
}
