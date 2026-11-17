// expect: which JSON decodes: JavaScript keeps the JSON text's key order
// code: NUCLO3002
interface User {
  name: string;
  age: number;
}
export function roundTrip(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text) as User);
  } catch {
    return "";
  }
}
