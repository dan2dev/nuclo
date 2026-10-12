// app.ts: the layout. It places the outlet once and reads the router live.
import { router } from "./routes.ts";
import { s } from "./styles.ts";

const link = (href: string, label: string) =>
  a(
    { href: router.href(href) },
    { "aria-current": () => (router.path === href ? "page" : "") },
    label,
  );

export const App = () =>
  div(
    s.app,
    nav(
      s.nav,
      link("/", "Home"),
      link("/docs", "Docs"),
      link("/blog/hello-world", "Blog post"),
      link("/blog/broken", "Broken post"),
      link("/orders/new", "New order"),
      link("/missing", "404"),
    ),
    main(
      s.main,
      when(() => router.pending, p("Loading…")),
      when(
        () => router.error !== null,
        div(
          s.error,
          p(() => `Failed: ${router.error?.message}`),
          button("Retry", {
            onClick: () => router.go(router.url, { replace: true }),
          }),
        ),
      ),
      router.outlet(), // every page lands here; a layer is a row on top
    ),
    footer(
      s.status,
      () => `path ${router.path}  pattern ${router.pattern}`,
      () => `  depth ${router.depth}`,
    ),
  );
