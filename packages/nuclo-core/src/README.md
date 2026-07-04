# Source layout

Every folder maps to one feature of the framework. If you know which public
function you are working on, you know which folder to open.

```
src/
├── index.ts        Public entry point — exports the whole API, auto-runs bootstrap
├── bootstrap.ts    Puts div(), span(), update(), list(), when(), css()… on globalThis
├── render.ts       render() and hydrate() — mounting an app into the DOM
├── hydration.ts    Cursor that walks server-rendered HTML during hydrate()/SSR
│
├── element/        How div("hi", { id: "x" }) becomes a real DOM element
│   ├── tags.ts           List of all HTML/SVG tags + global builder registration
│   ├── factory.ts        Creates the element and applies its modifier list
│   ├── modifiers.ts      Interprets each argument: text, attributes, children…
│   ├── attributes.ts     Applies attribute objects (static and reactive)
│   ├── class-name.ts     className merge rules (static + reactive classes)
│   ├── inline-style.ts   The style attribute/property
│   └── events.ts         on("click", …) modifier + listener cleanup
│
├── update/         update() — the reactivity engine
│   ├── update.ts             update(): re-runs everything below, fires "update" event
│   ├── scope.ts              scope("id") + UpdateScope so update("id") is targeted
│   ├── reactive-attributes.ts  Re-evaluates function-valued attributes
│   ├── reactive-text.ts        Re-evaluates function-valued text nodes
│   ├── conditional.ts          Swaps condition-driven elements in place
│   └── registry.ts             Bookkeeping: which nodes update() must visit
│
├── list/           list(items, render) — keyed list rendering
├── when/           when(cond, …).else(…) — conditional blocks
├── style/          css(), cx(), variants(), keyframes() — the CSS-in-JS engine
├── ssr/            renderToString() — server-side rendering
├── polyfill/       Minimal DOM implementation for running nuclo without a browser
│
└── shared/         Small generic helpers used by several features (no feature logic)
    ├── dom.ts            Low-level DOM ops: create/remove nodes, markers, cleanup
    ├── type-guards.ts    isFunction, isNode, isPrimitive…
    ├── conditions.ts     Safely evaluate boolean | () => boolean
    ├── renderables.ts    Resolve a renderable (tag builder or Node) to a Node
    ├── strings.ts        escapeHtml, camelToKebab…
    ├── environment.ts    isBrowser
    └── errors.ts         logError
```

Rules of thumb:

- **Features never live in `shared/`.** If a file knows about lists, when(),
  styling or updating, it belongs in that feature's folder.
- **`update/registry.ts` has no imports.** It is pure bookkeeping, which keeps
  the dependency graph acyclic: registry ← shared/dom ← everything else.
- **Tests mirror this tree**: `test/element/`, `test/update/`, `test/shared/`…
  one test folder per source folder.
- The published type surface lives in `../types/*.d.ts` and is hand-written;
  it does not depend on this internal layout.
