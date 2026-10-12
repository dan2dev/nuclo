/**
 * router.matches() — a second table rendered against the active route.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, type PageComponent, type RouteContext } from "../src/index";
import { deferred, flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Page: PageComponent = () => div("page");

describe("matches()", () => {
  it("renders the matching view with its params, by precedence, and follows navigation", async () => {
    const lazy = deferred<{ default: (ctx: RouteContext) => ReturnType<typeof div> }>();
    const router = createRouter({ "*": () => Page });
    routes.push(await router.start("/"));
    const host = mount();
    render(
      () =>
        div(
          { id: "m" },
          router.matches({
            "/": () => div("home"),
            "/blog/new": () => div("new"),
            "/blog/:slug": ({ slug }) => div(`post ${slug}`),
            "/files/*rest": ({ rest }) => div(`files ${rest}`),
            "*": () => lazy.promise,
          }),
        ),
      host,
    );
    const text = () => host.querySelector("#m")!.textContent;

    expect(text()).toBe("home");
    await router.go("/blog/new");
    expect(text()).toBe("new");
    // Matched raw, like the route table: %2F stays inside the one segment.
    await router.go("/blog/a%2Fb");
    expect(text()).toBe("post a/b");
    await router.go("/files/x/y.md");
    expect(text()).toBe("files x/y.md");

    // A lazy view renders nothing until its module lands, then the page with the context.
    await router.go("/nope/deep");
    expect(text()).toBe("");
    lazy.resolve({ default: (ctx) => div(`404 ${ctx.params["*"]} ${ctx.pattern}`) });
    await flush();
    expect(text()).toBe("404 nope/deep *");
  });

  it("logs a failed import and retries it on the next navigation", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let attempts = 0;
    const router = createRouter({ "*": () => Page });
    routes.push(await router.start("/"));
    const host = mount();
    render(
      () =>
        div(
          { id: "m" },
          router.matches({
            "*": () => (++attempts === 1 ? Promise.reject(new Error("offline")) : Promise.resolve(() => div("loaded"))),
          }),
        ),
      host,
    );
    await flush();
    expect(error).toHaveBeenCalledOnce();
    expect(host.querySelector("#m")!.textContent).toBe("");

    // A plain update() does not re-import; navigating does.
    update();
    await flush();
    expect(attempts).toBe(1);
    await router.go("/again");
    await flush();
    expect(attempts).toBe(2);
    expect(host.querySelector("#m")!.textContent).toBe("loaded");
  });
});
