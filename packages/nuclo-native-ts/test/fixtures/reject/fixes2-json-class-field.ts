// expect: Holder.owner is the class Person, whose objects only its constructor makes
// code: NUCLO6001
import { fetch } from "../../../src/index.ts";
class Person {
  constructor(public name: string) {}
}
interface Holder {
  title: string;
  owner: Person;
}
export async function load(): Promise<string> {
  const res = await fetch("https://example.org/holder.json");
  const h = await res.json<Holder>();
  return h.title;
}
