// expect: handle null with ?? first
export function label(name?: string): string {
  return `Hi ${name}`;
}
