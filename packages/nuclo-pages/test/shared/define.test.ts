import { describe, expect, it } from "vitest";
import { ErrorPage, Layout, Page } from "../../src/index";

describe("Page / Layout / ErrorPage", () => {
  it("return the definition as it is", () => {
    const render = () => div();
    const page = { load: () => 1, actions: { save: () => 2 }, render };
    expect(Page(page)).toBe(page);
    const layout = { render };
    expect(Layout(layout)).toBe(layout);
    const error = { render };
    expect(ErrorPage(error)).toBe(error);
  });

  it("require a render function", () => {
    expect(() => Page({} as never)).toThrow("Page() needs a render function: export default Page({ render: … })");
    expect(() => Layout({ render: "nope" } as never)).toThrow("Layout() needs a render function");
    expect(() => ErrorPage(undefined as never)).toThrow("ErrorPage() needs a render function");
  });
});
