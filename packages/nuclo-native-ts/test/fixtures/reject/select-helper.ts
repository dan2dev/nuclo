// expect: option() belongs inside a select()
// code: NUCLO5001
import { list, option, select } from "../../../src/index.ts";

const row = (name: string) => option({ value: name }, name);
const names: string[] = ["a", "b"];

export const App = () => select(list(() => names, (name) => row(name)));
