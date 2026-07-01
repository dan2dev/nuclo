# nuclo styling — feature showcase

A live, runnable tour of **every feature** in nuclo's atomic CSS-in-TS styling
system. Each section is built with `css()` / `cx()` / `variants()` /
`keyframes()` / `globalStyle()` from a single themed `createCss()` instance and
rendered to the DOM.

```bash
bun install      # from the repo root (npm/pnpm also work — it's a workspace)
bun run dev      # in this folder, then open the printed URL
```

## What it covers

| File | Features |
|------|----------|
| `src/theme.ts` | `createCss()` with `colors`, `fonts`, `shadows`, `radii`, `screens` |
| `src/ui.ts` | `globalStyle()` resets; layout built with `css()` |
| `sections/basics.ts` | camelCase→kebab, number→px, unitless values, spacing/sizing/typography aliases, composite utilities (`row`, `col`, `center`, `truncate`) |
| `sections/tokens.ts` | color / font / shadow / radius tokens, and raw-value passthrough |
| `sections/variants.ts` | pseudo-classes & elements, responsive `screens`, nested combinations (`md:{ hover }`, `md:{ dark }`), arbitrary `&` selectors, inline `@media`/`@supports`, and `raw` |
| `sections/compose.ts` | `cx()` last-wins conflict resolution, conditionals, array flattening, external classes |
| `sections/recipes.ts` | `variants()` — `base`, variant groups, boolean variants, `defaultVariants`, `compoundVariants` |
| `sections/animation.ts` | `keyframes()` (`from`/`to` and percentage stops) driving `animation` |
| `sections/generated.ts` | `getCssText()` — the serialized atomic stylesheet (SSR CSS collection) |

Type safety is on display too: this project builds under `tsc --strict`, and
selecting an undefined variant or mistyping a property is a compile error.
