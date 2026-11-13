import "./dom";
import "nuclo";
import { flush } from "./dom";

export { flush };

// One host round-trip per render()/update(), however many nodes changed.
const g = globalThis as unknown as Record<string, (...args: unknown[]) => unknown>;
for (const name of ["render", "update", "forceUpdate"]) {
  const fn = g[name];
  g[name] = (...args) => {
    try {
      return fn(...args);
    } finally {
      flush();
    }
  };
}
