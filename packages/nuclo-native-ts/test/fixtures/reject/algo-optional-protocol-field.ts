// expect: implements an optional property of an interface
// code: NUCLO4004
interface Plugin {
  name: string;
  priority?: number;
}
class Trim implements Plugin {
  name = "trim";
  priority = 10;
}
export const p: Plugin = new Trim();
