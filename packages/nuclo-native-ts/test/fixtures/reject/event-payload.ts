// expect: Property 'value' does not exist on type 'PanEvent'
// code: TS2339
import { console, div, render } from "../../../src/index.ts";

render(() => div({ onPan: (e) => console.log(e.value) }));
