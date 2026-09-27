import * as devalue from "devalue";
import { getCssText, renderToString } from "nuclo/ssr";
import { bindActions, compose, errorLevel, firstFailure, layoutLevel, pageLevel, pick, runLoad, type Level, type Outlet } from "../shared/compose";
import { errorInfo, isHttpError, isRedirect } from "../shared/errors";
import { headToHtml, mergeHead } from "../shared/head";
import type { Match } from "../shared/routes";
import type { Loader, Payload, RootDef, RouteDef, RouteModule } from "../shared/types";
import type { EventState } from "./event";

/** Built client files for a module: its chunk, the chunks it imports, and its CSS. */
export interface AssetSet {
  js: string;
  css: string[];
  preload: string[];
}

export interface Assets {
  entry: AssetSet;
  /** Per route module (same numbering as `modules`); null when not in the client build. */
  modules: (AssetSet | null)[];
}

/** The app template split around its placeholders; `titled` drops the template's own <title>. */
export interface Template {
  plain: [string, string, string];
  titled: [string, string, string];
}

export interface ServerContext {
  modules: readonly (Loader | null)[];
  routes: readonly RouteDef[];
  root: RootDef;
  serverFns: Readonly<Record<string, Loader>>;
  template: Template;
  assets: Assets;
  dev: boolean;
  base: string;
}

const HEAD = "<!--nuclo:head-->";
const BODY = "<!--nuclo:body-->";

export function parseTemplate(html: string): Template {
  const split = (source: string): [string, string, string] => {
    const head = source.indexOf(HEAD);
    const body = source.indexOf(BODY);
    if (head < 0 || body < head) throw new Error(`The app template needs ${HEAD} in <head> and ${BODY} in <body>`);
    return [source.slice(0, head), source.slice(head + HEAD.length, body), source.slice(body + BODY.length)];
  };
  return { plain: split(html), titled: split(html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "")) };
}

export function importModule(ctx: ServerContext, index: number): Promise<RouteModule> {
  const loader = index < 0 ? null : ctx.modules[index];
  return loader ? loader() : Promise.resolve({});
}

/** Server-renders a matched page, or the root error view for an unmatched URL (404). */
export async function renderPage(ctx: ServerContext, state: EventState, match: Match | null): Promise<Response> {
  const { url } = state.event;
  const route = match?.route ?? null;
  const params = match?.params ?? {};
  state.event.params = params;
  // `route` reads this request's snapshot (async context), so concurrent requests never mix.
  state.route = { id: route?.id ?? "", url, params, pending: false };

  const layouts = route ? route.layouts : [[ctx.root.layout, []] as [number, string[]]];
  const modules = [...layouts.map(([module]) => module), ...(route ? [route.page] : [])];
  const mods = await Promise.all(modules.map((module) => importModule(ctx, module)));
  const results = await Promise.allSettled(
    mods.map((mod, i) => runLoad(mod, i < layouts.length ? { params: pick(params, layouts[i][1]) } : { params, url })),
  );
  const failure = firstFailure(results);
  if (failure && isRedirect(failure.reason)) {
    return new Response(null, { status: failure.reason.status, headers: { location: failure.reason.location } });
  }
  const data = results.map((result) => (result.status === "fulfilled" ? result.value : undefined));

  let levels: Level[];
  let status = 200;
  let error: Payload["e"];
  if (route && !failure) {
    const page = layouts.length;
    levels = [
      ...layouts.map(([module, names], i) => layoutLevel(module, mods[i], names, params, data[i])),
      // On the server, actions are plain calls (a view only triggers them in the browser).
      pageLevel(route.page, mods[page], params, url, data[page], bindActions(mods[page], async (action, args) => action(...args))),
    ];
  } else {
    // A failing load renders its boundary; an unmatched URL is a 404 inside the root layout.
    const at = failure ? failure.index : 1;
    const boundary: [number, number] = route ? route.errors[at] : [ctx.root.error, at === 0 ? 0 : 1];
    const info = failure ? errorInfo(failure.reason, ctx.dev) : { status: 404, message: "Not Found" };
    if (failure && !isHttpError(failure.reason)) console.error(failure.reason);
    status = info.status;
    error = { s: info.status, m: info.message, b: boundary };
    levels = [
      ...layouts.slice(0, boundary[1]).map(([module, names], i) => layoutLevel(module, mods[i], names, params, data[i])),
      errorLevel(await importModule(ctx, boundary[0]), info.status, info.message),
    ];
    modules.splice(boundary[1], modules.length, boundary[0]);
  }

  const payload: Payload = { r: route ? ctx.routes.indexOf(route) : -1, p: params, d: data.slice(0, error ? error.b[1] : data.length) };
  if (error) payload.e = error;

  let head: string;
  let body: string;
  let titled: boolean;
  try {
    const merged = mergeHead(levels.map((level) => level.head?.({ ...level.props, url } as never)));
    titled = merged.title !== undefined;
    // renderToString(factory) renders in serialization mode, so text keeps its hydration
    // markers even under a DOM emulator; it swallows errors, so capture them here.
    const root = compose(levels, [] as Outlet[]).create();
    let thrown: { error: unknown } | undefined;
    const html = renderToString((parent, index) => {
      try {
        return root(parent, index);
      } catch (error) {
        thrown = { error };
        throw error;
      }
    });
    if (thrown) throw thrown.error;
    const assets = collectAssets(ctx.assets, modules);
    head =
      headToHtml(merged) +
      `<style id="nuclo-styles">${getCssText().replace(/<\/style/gi, "<\\/style")}</style>` +
      assets.css.map((file) => `<link rel="stylesheet" href="${file}">`).join("") +
      assets.preload.map((file) => `<link rel="modulepreload" href="${file}">`).join("");
    body =
      `<div id="app">${html}</div>` +
      `<script type="application/json" id="nuclo-data">${devalue.stringify(payload).replace(/</g, "\\u003c")}</script>` +
      `<script type="module" src="${ctx.assets.entry.js}"></script>`;
  } catch (e) {
    console.error(e);
    const message = ctx.dev && e instanceof Error ? (e.stack ?? e.message) : "Internal Error";
    return new Response(message, { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const [start, middle, end] = titled ? ctx.template.titled : ctx.template.plain;
  return new Response(start + head + middle + body + end, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function collectAssets(assets: Assets, modules: readonly number[]): { css: string[]; preload: string[] } {
  const css = new Set(assets.entry.css);
  const preload = new Set(assets.entry.preload);
  for (const module of modules) {
    const set = module < 0 ? null : assets.modules[module];
    if (!set) continue;
    preload.add(set.js);
    for (const file of set.preload) preload.add(file);
    for (const file of set.css) css.add(file);
  }
  return { css: [...css], preload: [...preload] };
}
