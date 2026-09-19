# Styling performance investigation

Measured September 19, 2026 against the **staged checkout present at the start of this investigation**, including its existing `cx` pair memo, result prototype, and lazy default instance. These numbers do not compare against HEAD, which lacks those staged improvements.

## CSSOM loading and hydration

Run `bun bench/style-dom.bench.ts`. This uses the installed jsdom implementation, fresh registries, and structurally fresh style inputs. Hydration starts with a server-rendered style element. Results below are medians of three fresh-process runs in this workspace; they are not real-browser page-load measurements. Smaller cases benefit differently from JIT warmup.

| Responsive rules | Before cold | After cold | Before hydration | After hydration |
| --- | ---: | ---: | ---: | ---: |
| 500 | 45.3 ms | 10.7 ms | 55.5 ms | 4.7 ms |
| 1,000 | 127.3 ms | 6.8 ms | 229.1 ms | 5.2 ms |
| 2,000 | 585.4 ms | 10.9 ms | 904.3 ms | 13.4 ms |

The previous insertion path evaluated `groupQueryOf(group)` for every rule, even without external rules to deduplicate. Reading the group's `cssText` serializes all its children, causing quadratic work. Query preludes are now cached under weak CSSRule keys, and external-rule matching is skipped entirely when no external index exists. The weak keys do not retain detached stylesheets. Regression tests assert that growing groups are not serialized on subsequent inserts, including hydration with an unmatched external rule.

## Retained memory and initialization

Run `bun bench/style-memory.bench.ts`. After warming 2,000 property conversions, this synthetic stress test compiles another 50,000 distinct camel-cased custom property names, periodically resets the generated-rule registry, forces collection, and measures the heap delta:

| | Before | After |
| --- | ---: | ---: |
| Retained heap delta | 6,467 KiB | 20 KiB |

This isolates property-name conversion retention, not normal application memory. GC measurements vary by runtime and run. Already-normalized properties no longer enter the conversion cache; converted names have a 512-entry ceiling. The shared engine registry is now initialized on demand, avoiding its four maps, set, array, and state object on unused-style imports. A regression test verifies that importing styling and constructing an empty-theme instance leave the registry unallocated.

Generated rules still deliberately live until `resetStyles()`: evicting them could break mounted elements and class composition. Use inline styles for unbounded per-instance values. No automatic rule eviction or SSR request isolation was introduced.

## Hot paths and correctness tradeoffs

One run of `bun bench/style.bench.ts` (nanoseconds/op; microbenchmarks are noisy):

| Operation | Before | After |
| --- | ---: | ---: |
| Same-object css | 5 | 39 |
| Equal temporary css | 309 | 293 |
| Two-object cx | 13 | 46 |
| Single-input cx | 39 | 23 |
| Cached variants | 76 | 110 |
| Unique css block | 709 | 722 |

Known declaration blocks no longer build unused CSS bodies. Single-token composition avoids allocating a Set. Multi-token strings still go through conflict resolution, including when supplied as one input.

Cache hits now restore removed stylesheets; pair-cache hits validate current input class names; recipe caches clear on engine reset. These correctness checks explain the extra tens of nanoseconds in cached operations. Public style inputs retain the existing identity-cache contract; mutating an already compiled style object is not made reactive.

## Download size

Matching minified ESM builds without source maps: 45,917 → 46,225 raw bytes; 15,344 → 15,579 gzip bytes (Node zlib defaults). The additional guards and lazy engine access cost **235 gzip bytes**. This change improves initialization and CSSOM loading, not download size. The existing bundle comparison reports 13,222 raw / 4,679 gzip bytes attributable to styling versus its synthetic no-style entry; that entry is not a supported package API.

## Validation

The styling suite covers CSS ordering, named classes, SSR hydration, cross-entry state, recipe reset, mutable class inputs, and stylesheet recovery. Full tests, typechecking, coverage, and production build are run using the package's configured Node toolchain. Running Vitest through Bun instead caused four unrelated DOM collectability assertions to fail; the Node run passed. ESLint currently ignores these TypeScript paths, so its successful exit is not a lint validation claim.
