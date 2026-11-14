import "./dom";
import { getCssText } from "nuclo";
import { flush, useStylesheet } from "./dom";

// css(), createCss() and globalStyle() rules reach the native hosts through this.
useStylesheet(getCssText);

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
