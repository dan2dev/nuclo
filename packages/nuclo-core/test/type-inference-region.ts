/// <reference path="../types/index.d.ts" />
import * as api from "../types/index";
import * as source from "../src/index";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

const globalAnchor = render(into("main", "content"));
const moduleAnchor = api.render(api.region({ id: "main", type: "stack" }));
const sourceAnchor = source.render(source.into("main"));
const hydratedAnchor = api.hydrate(() => api.into("main"));
const forcedAnchor = source.forceUpdate(source.region({ id: "main" }));
const listAnchor = api.render(api.list(() => [1], n => span(n)));
type _Global = Expect<Equal<typeof globalAnchor, Comment>>;
type _Module = Expect<Equal<typeof moduleAnchor, Comment>>;
type _Source = Expect<Equal<typeof sourceAnchor, Comment>>;
type _Hydrate = Expect<Equal<typeof hydratedAnchor, Comment>>;
type _Force = Expect<Equal<typeof forcedAnchor, Comment>>;
const whenAnchor = api.render(api.when(true, span("yes")).else("no"));
type _When = Expect<Equal<typeof whenAnchor, Comment>>;
type _List = Expect<Equal<typeof listAnchor, Comment>>;

const field = api.render(input({ onInput(event) {
  type _Target = Expect<typeof event.currentTarget extends HTMLInputElement ? true : false>;
  const value: string = event.currentTarget.value;
  void value;
} }));
type _Input = Expect<Equal<typeof field, ExpandedElement<"input">>>;

api.into({ main: [input({ value: "x" }), "text"] as const });
source.into("main", list(() => [{ id: 1, name: "a" }] as const, item => {
  type _Item = Expect<Equal<typeof item, { readonly id: 1; readonly name: "a" }>>;
  return span(item.name);
}));
// @ts-expect-error a marker is not an input element
const invalidElement: HTMLInputElement = globalAnchor;
// @ts-expect-error region ids must be strings
api.region({ id: 1 });
// @ts-expect-error unsupported region mode
source.region({ id: "main", type: "queue" });
// @ts-expect-error unsupported region option
region({ id: "main", typo: true });
// @ts-expect-error view id must be a string or target record
api.into(123);
// @ts-expect-error a target record does not take positional content
source.into({ main: "a" }, "b");
// @ts-expect-error invalid attribute type inside a view
into("main", input({ value: 42 }));
// @ts-expect-error inferred item properties remain checked
api.list(() => [{ id: 1 }], item => span(item.missing));

export {};

// Declared and source signatures must agree, not just export the same names.
type _RegionSignature = Expect<Equal<typeof api.region, typeof source.region>>;
type _ViewSignature = Expect<Equal<typeof api.into, typeof source.into>>;
type _RenderSignature = Expect<Equal<typeof api.render, typeof source.render>>;
type _HydrateSignature = Expect<Equal<typeof api.hydrate, typeof source.hydrate>>;
type _ForceSignature = Expect<Equal<typeof api.forceUpdate, typeof source.forceUpdate>>;

// Region modes accept the new name and reject the removed spelling.
api.region({ id: "main", type: "latest" });
source.region({ id: "main", type: "latest" });
region({ id: "main", type: "latest" });
type _RegionModes = Expect<Equal<RegionType, "latest" | "stack">>;
// @ts-expect-error the old mode name was replaced by latest
api.region({ id: "main", type: "simple" });
// @ts-expect-error source and globals must reject the old name too
source.region({ id: "main", type: "simple" });
// @ts-expect-error the global API uses the same mode names
region({ id: "main", type: "simple" });

// Inferred implementation returns must remain compatible in both directions.
const declaredApi: typeof api = source;
const implementedApi: typeof source = api;
void declaredApi;
void implementedApi;
