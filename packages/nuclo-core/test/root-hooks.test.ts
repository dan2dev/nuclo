/**
 * @vitest-environment jsdom
 *
 * onRootBuild(): every root pass runs the hooks once, after the root's
 * component has been called and before its tree is built.
 */
import "../src";
import { describe, it, expect, afterEach } from "vitest";
import { onRootBuild, render, hydrate, forceUpdate } from "../src";
import { renderToString } from "../src/ssr/render-to-string";

const log: string[] = [];
let off: () => void = () => {};

/** A component that logs when it is called and when its tree is built. */
const App = () => {
  log.push("component");
  return div(() => {
    log.push("build");
  });
};

afterEach(() => {
  off();
  log.length = 0;
  document.body.innerHTML = "";
});

describe("onRootBuild()", () => {
  it("runs between the component call and the build, in every root pass", () => {
    off = onRootBuild((serializing) => log.push(`hook:${serializing}`));
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(App, container);
    expect(log.splice(0)).toEqual(["component", "hook:false", "build"]);

    forceUpdate();
    expect(log.splice(0)).toEqual(["component", "hook:false", "build"]);

    const html = renderToString(App);
    expect(log.splice(0)).toEqual(["component", "hook:true", "build"]);

    container.innerHTML = html;
    hydrate(App, container);
    expect(log.splice(0)).toEqual(["component", "hook:false", "build"]);
  });

  it("stops running once unregistered", () => {
    onRootBuild((serializing) => log.push(`hook:${serializing}`))();
    renderToString(App);
    expect(log).toEqual(["component", "build"]);
  });
});
