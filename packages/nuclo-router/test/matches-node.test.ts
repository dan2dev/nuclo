// @vitest-environment node
/**
 * router.matches() under renderToString() on a real server: no window, the
 * view picked from the Route run() makes active, beside the outlet.
 */
import { describe, it, expect } from "vitest";
import "nuclo/polyfill";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Router, type RouterOptions } from "../src/index";

const Page: PageComponent = (ctx) => div({ id: "page" }, ctx.path);

const App = (router: Router) => () =>
  div(
    main(router.outlet()),
    aside(
      { id: "m" },
      router.matches({
        "/": () => span("home"),
        "/blog/new": () => span("new"),
        "/blog/:slug": ({ slug }) => span(`post ${slug}`),
        "/files/*rest": ({ rest }, ctx) => span(`files ${rest} ${ctx.pattern} ${ctx.search.get("v")}`),
      }),
    ),
  );

async function ssr(url: string, options?: RouterOptions): Promise<string> {
  const router = createRouter({ "*": () => Page }, options);
  const route = await router.start(url);
  return route.run(() => renderToString(App(router)));
}

/** The markup without nuclo's hydration comments. */
const strip = (html: string): string => html.replace(/<!--.*?-->/g, "");

/** The markup between the aside's list markers, comments stripped. */
const view = (html: string): string =>
  strip(/<aside id="m"><!--list-start[^>]*-->(.*)<!--list-end[^>]*--><\/aside>/.exec(html)![1]);

describe("matches() under renderToString()", () => {
  it("renders the matching view beside the outlet's page", async () => {
    const html = await ssr("/blog/hello");
    expect(strip(html)).toContain('<main><div id="page">/blog/hello</div></main>');
    expect(view(html)).toBe("<span>post hello</span>");
  });

  it("picks by the route table's precedence: static before param", async () => {
    expect(view(await ssr("/blog/new"))).toBe("<span>new</span>");
    expect(view(await ssr("/"))).toBe("<span>home</span>");
  });

  it("hands the view its own pattern and the request's search", async () => {
    expect(view(await ssr("/files/a/b.md?v=2"))).toBe("<span>files a/b.md /files/*rest 2</span>");
  });

  it("matches the raw path, like the route table: %2F stays in one segment", async () => {
    expect(view(await ssr("/blog/a%2Fb"))).toBe("<span>post a/b</span>");
  });

  it("matches the path with the base stripped", async () => {
    const html = await ssr("/app/blog/based", { base: "/app" });
    expect(view(html)).toBe("<span>post based</span>");
  });

  it("renders only the empty list when nothing matches", async () => {
    const html = await ssr("/nope");
    expect(strip(html)).toContain('<div id="page">/nope</div>');
    expect(view(html)).toBe("");
  });

  it("keeps interleaved requests apart", async () => {
    const router = createRouter({ "*": () => Page });
    const [a, b] = await Promise.all([router.start("/blog/a"), router.start("/files/x")]);

    const htmlB = b.run(() => renderToString(App(router)));
    const htmlA = a.run(() => renderToString(App(router)));
    expect(view(htmlA)).toBe("<span>post a</span>");
    expect(view(htmlB)).toBe("<span>files x /files/*rest null</span>");
  });

  it("renders the same Route twice identically", async () => {
    const router = createRouter({ "*": () => Page });
    const route = await router.start("/blog/twice");
    const first = route.run(() => renderToString(App(router)));
    expect(route.run(() => renderToString(App(router)))).toBe(first);
  });

  it("matches a nested route by its full path", async () => {
    const Layout: PageComponent = (_ctx, { outlet }) => section(outlet());
    const router = createRouter({ "/docs": { "/": () => Layout, "/:topic": () => Page } });
    const route = await router.start("/docs/intro");
    const html = route.run(() =>
      renderToString(() => div(router.outlet(), router.matches({ "/docs/:topic": ({ topic }) => b(topic) }))),
    );
    expect(strip(html)).toBe('<div><section><div id="page">/docs/intro</div></section><b>intro</b></div>');
  });

  // ponytail: documents the known ceiling in matches() — lazy views land on the client only.
  it("ships nothing for a lazy view: its module lands on the client", async () => {
    const router = createRouter({ "*": () => Page });
    const route = await router.start("/");
    const lazyApp = () => div({ id: "m" }, router.matches({ "/": () => Promise.resolve(() => span("lazy")) }));

    expect(route.run(() => renderToString(lazyApp))).not.toContain("lazy");
    await new Promise((resolve) => setTimeout(resolve, 0));
    // A fresh render calls matches() afresh: still nothing.
    expect(route.run(() => renderToString(lazyApp))).not.toContain("lazy");
  });
});
