# Nuclo localization audit — 2026-10-17

## Scope and architecture

English is canonical. The website supports `en`, `pt-br`, `es`, `fr`, `it`, `de`, `ja`, `zh` (Simplified Chinese / `zh-CN`), `ko`, `ar` (RTL), `ru`, and `hi`.

Reviewed resource inventory: 81 locale files. English has `ui.ts`, `home.ts`, `docs.ts`, and `examples.ts`; each other locale has those files plus `docs-1.ts`, `docs-2.ts`, and the bundle-only `index.ts`. The resources cover the homepage, navigation/footer, controls, loading/errors, accessibility labels, SEO, all 8 documentation groups / 42 sections, 75 example titles/descriptions, and 9 hero examples. Canonical example metadata also lives beside its implementation in `src/pages/examples/`, `src/components/api-demos.ts`, and `src/content/examples.ts`.

`src/i18n/index.ts` defines metadata, lazy bundles and URL helpers. `pages/docs/content.ts` overlays locale prose on canonical executable sections by section ID. `pages/examples/registry.ts` overlays example metadata. `seo.ts` supplies localized page, Open Graph and Twitter text, canonical URLs and language alternates. Existing translations also live in the shop demo's `src/demos/apps/i18n/messages.ts` (English, Brazilian Portuguese, German, Japanese, Egyptian Arabic), with a generated source copy in `src/generated/app-demo-sources.ts`.

The [working glossary](localization-glossary.md) records per-language terminology and technical invariants. Every editorial task was given this standard: grammatical correctness is insufficient; use the words a native developer would naturally choose to explain the same technical concept.

## Confirmed coverage and limitations

- Automated checks verify identical message paths, required dynamic parameters, complete ordered document sections, all example/hero IDs, canonical links, inline API identifiers/placeholders, executable snippets and benchmark data. Extra example IDs are rejected. Type checking detects syntactically duplicated object keys/exports. No missing supported resource keys or extra example IDs were found.
- Shared interactive example bodies still contain English controls, validation messages, placeholders and accessibility strings. Examples include `component-demos.ts`, `form-demos.ts`, `components/api-demos.ts`, `svg-demos.ts`, and the hero playground. Their current architecture shares executable implementations; translating all runtime controls requires extending that architecture. This audit improves existing locale resources and the already multilingual shop, without adding another translation system.
- `/apps/:id` and `/desktop` intentionally remain English, without locale-prefixed routes. Routing tests verify this behavior. Documentation code samples deliberately remain canonical English, including identifiers and strings shown as executable teaching material.
- Comparison, quick-start and teaser translation data exists for sections defined in `pages/home/components.ts` that `Home.ts` currently does not mount. It was reviewed and retained. Static key checks cannot prove every individual message is used because consumers read objects dynamically; no speculative key deletions were made.
- Website/SoftwareSourceCode JSON-LD descriptions were hardcoded in English. They now reuse the existing localized home SEO description; regression tests cover every locale and page type.
- Localization work preserves routes, public APIs, dependencies, example logic and application update behavior. Unrelated workspace dependency updates were preserved outside this audit. Audit agents did not create commits or push.

## Editorial coverage by locale

Every translated locale: all seven resource files reviewed; six text files edited in each locale except Russian (five, with ui.ts retained) and Hindi (five, with docs.ts retained). Bundle indexes retained. Areas reviewed: homepage/headlines, documentation/API/router/SSR, example metadata, UI/accessibility, errors and SEO. English resources were used as the semantic baseline; the shop's English free-shipping copy was clarified to match its existing inclusive threshold (`subtotal() >= FREE_OVER`).

| Locale | Significant issues corrected | Reviewed resource files | Remaining limits |
|---|---|---|---|
| English | Canonical semantic/reference review; clarified shop free-shipping threshold to match existing `>=` behavior | 4 canonical modules, colocated example metadata, shop dictionary | Canonical product/benchmark claims preserved; shared demo controls remain English |
| Brazilian Portuguese | Touched-field calques, list identity, hydration reuse, recursion, cleanup and navigation terminology | All 7; 6 edited | Shared demo/code scope above |
| Spanish | Fine-grained patching calque, builders, cleanup callbacks, module loading and SVG/form copy | All 7; 6 edited | Shared demo/code scope above; neutral developer Spanish |
| French | Lost type-safety meaning, literal ownership, invalid linkable-layer wording, hydration and form microcopy | All 7; 6 edited | Shared demo/code scope above |
| Italian | Explicit-update headline, builder/region terminology, CSS terms, stale responses; restored inline code placeholder | All 7; 6 edited | Shared demo/code scope above |
| German | Literal ownership/patching, incomplete clauses, input/exception and routing terminology | All 7; 6 edited | Shared demo/code scope above |
| Japanese | Literal ownership, patching, touched fields and router metaphors; removed invented shop-product origin | All 7; 6 edited | Shared demo/code scope above |
| Simplified Chinese | Ambiguous headline, patching/identity, stale-request counter, chart candlesticks and scheduling | All 7; 6 edited | Shared demo/code scope above |
| Korean | Function calls as phone calls, children/arguments, identity, hydration, malformed prose in tables and route semantics | All 7; 6 edited | Shared demo/code scope above |
| Arabic | Missing/incorrect clauses, translated runtime names, SSR escaping, exceptions, state/identity and route/layer semantics | All 7; 6 edited | Shared demo/code scope above; RTL retained |
| Russian | State/call, identity/id, loaders/outlets, leave guards, retained attributes and example-domain terms | All 7; 5 edited; ui/index retained | Shared demo/code scope above |
| Hindi | No/number, functions, string values, falsy, cleanup, CSS/router tables, lifecycle and route semantics | All 7; 5 edited; docs/index retained | Shared demo/code scope above |

Representative before/after examples (semantic corrections and editorial judgments, not human certification):

| Locale | Before | After |
|---|---|---|
| English | Free shipping over … | Free shipping on orders of … or more. |
| English | A into() | An into() |
| pt-BR | campos tocados | campos visitados |
| pt-BR | Fechar navegador | Fechar navegação |
| es | Parcheo de grano fino | Actualizaciones precisas del DOM |
| es | solo calienta módulos | solo precarga módulos |
| fr | Un petit framework DOM typé | Un petit framework DOM au typage sûr |
| fr | Vous possédez le cycle de mise à jour | Vous contrôlez le cycle de mise à jour |
| it | Il ciclo di aggiornamento è tuo | Controlli tu il ciclo di aggiornamento |
| it | `@media &lt;valore&gt;` | `@media &lt;value&gt;` (canonical code placeholder restored) |
| de | Du besitzt den Update-Zyklus | Du steuerst den Update-Zyklus |
| de | Feinkörniges Patchen | Gezielte DOM-Updates |
| ja | 更新サイクルはあなたのもの | 更新のタイミングを自分で決める |
| ja | きめ細かなパッチ | DOM の必要な箇所だけを更新 |
| zh-CN | 细粒度修补 | 精准更新 DOM |
| zh-CN | 一个代数计数器 | 一个请求序号计数器 |
| ko | 전화 | 호출 (function invocation) |
| ko | 정신 모델 | 동작 모델 |
| ar | DOM صغير للعقدة والكعكة | تنفيذ صغير لـ DOM في Node وBun |
| ar | إعادة تسمية السكان المحليين | غيّر أسماء المتغيرات المحلية |
| ru | Измените свой статус, а затем позвоните по update() | Измените состояние, затем вызовите update() |
| ru | Маршрутные погрузчики | Загрузчики данных маршрутов |
| hi | समारोह (function mistranslated as ceremony) | फ़ंक्शन |
| hi | सूक्ष्म पैचिंग | DOM के ज़रूरी हिस्सों को अपडेट करना |

The already multilingual shop also preserves product facts (Japanese cast-iron teapot no longer asserts Nambu provenance; shipped order no longer becomes merely received), improves Portuguese add-to-cart/raw-honey copy, and clarifies Arabic cocoa composition and quantity controls. German `ab` and Japanese `以上` correctly match the existing inclusive free-shipping threshold and were retained.

## Independent quality assurance

Eighteen subagents participated: one read-only architecture/inventory agent; a terminology specialist who subsequently edited French; ten other locale-specific editorial agents; and six independent QA agents, each reviewing two locales they had not edited. The coordinator handled shared resources, source clarifications, glossary, tests, production builds and the final cross-language comparison.

| Independent reviewer | Locales | Material follow-up findings corrected |
|---|---|---|
| qa_pt_fr | pt-BR, fr | Explicit-update headline/type safety; French autonomous app actions had drifted into fullscreen; cleanup functions and loader responsibility |
| qa_es_it | es, it | Hydration reuse, shadowing instructions, grammatical agreement, touched fields, stacked-chart terminology and opaque benchmark prose |
| qa_de_ja | de, ja | Promise rejection/Route stop wording, graph/evaluation counters, lazy loading and lifecycle/recursion/scheduling wording |
| qa_zh_ko | zh-CN, ko | Korean omitted update steps, falsy semantics, attribute clearing, nested outlet/rendering and lifecycle/SSR statements; Chinese modifier/domain language |
| qa_ar_ru | ar, ru | Arabic inverted forceUpdate attribute-retention claim; missing hydration distinctions, lifecycle/navigation/Promise semantics; restored repeated inline-code wrappers |
| qa_en_hi | en, hi | English grammar/source clarification; Hindi semantic, lifecycle, component-state and route/API qualifiers |

The independent reviewers read all 42 documentation sections, including separate `afterContent` fields, and all 75 example metadata entries per locale, plus homepage, shared UI, accessibility, errors, SEO and dynamic labels. They challenged first-pass edits and applied additional corrections. Their assessments are editorial model judgments.

A final cross-language comparison exposed an ambiguous stacked-area-chart claim: zero thickness changes a band's geometry, while its SVG command structure stays constant for interpolation. The English reviewer checked `band()` in `src/pages/examples/svg-chart-demos.ts`; the canonical metadata now says “keeps the same command structure,” and every locale follows that technical meaning. The English article correction `A into()` → `An into()` also came from independent review. Code samples and chart behavior are unchanged.

## Validation

Validation used the installed Bun/Node toolchain and the existing cached Chromium executable. No new testing framework or dependency was added.

- Baseline: `bun test tests/i18n-coverage.test.ts tests/i18n-routing.test.ts` — 97 passed, 0 failed, 2,015 assertions.
- Final unit/integrity suite: `bun test tests/*.test.ts` — 158 passed, 0 failed, 3,182 assertions across 8 files.
- Final strict type check: `bun x tsc --noEmit` — passed; includes configured unused-local/parameter checks. There is no dedicated docs lint script.
- Production build: `bun run build` passed during the audit. After all editorial/QA corrections, `bun x vite build`, `bun x vite build --config vite.demo.config.ts`, and `bun build-server.ts` passed again, including all eight configured server targets. `update:llms` and `update:demos` refreshed the relevant generated copies; unrelated generated churn was excluded.
- Browser suite: 19 scenarios verified: all 7 desktop/navigation/404/shop cases passed; after correcting the shared mobile gutter defect, all 12 locale-specific mobile cases passed with `bun x playwright test tests/i18n-navigation.spec.ts --project=stress-chromium --grep 'mobile languages' --max-failures=1` (1.6 minutes). The full run used the same file/project without the grep filter. The initial mobile failure is resolved; there are no remaining failed cases. Runs used `PLAYWRIGHT_CHROME_EXECUTABLE_PATH` pointing at the existing cached Chromium executable.
- Translation integrity checks cover all message paths and required dynamic parameters; no extra example IDs; documentation section order and afterContent parity; all 95 rendered documentation code samples per locale; inline code identifiers/placeholders; links; hero executable samples and quick-start commands; benchmark values/URLs; localized titles/Open Graph/Twitter/JSON-LD; HTML language/direction, hreflang, canonical URLs and localized 404 behavior.
- The shop checks cover dynamic parameters and plural categories for English, Portuguese, German, Japanese and Arabic. Browser checks preserve cart/coupon state during language changes and exercise the counter in every site locale.
- An additional exact-match audit found no untranslated prose strings longer than 40 characters matching English outside code, URLs and the proper-name/legal footer. This is a heuristic, not proof against every mixed-language phrase.

Transient checks caught accidental sample-spacing changes and two missing Hindi API anchors; these were restored. The browser test was updated from a removed combobox to the existing header language dialog and now closes/reopens full-screen examples through normal navigation. It also follows the current mobile header, where the language control sits above the menu. Reported final results use the corrected source.

The mobile viewport check exposed a shared documentation layout defect in English too: the section bar used a 24px negative margin against an 18px phone gutter, overflowing the viewport by 6px on each side. `src/pages/docs/styles.ts` now uses the existing `--gutter` token for the bar's margin and padding, eliminating conflicting breakpoint values. This is a presentation correction; no page interaction or application logic changed. The existing all-locale viewport tests cover it.

Mobile measurements use Chromium emulation at 390×844, not physical iOS/Android hardware. CSS width and navigation were verified in that environment; real-device touch, keyboard, safe-area and browser-chrome behavior were not certified.

## Assessment

The table summarizes the final editorial judgments. “Complete resources” means matching keys, 42 documentation sections and 75 example metadata entries; runtime-demo exceptions remain documented above for every locale. Technical accuracy is judged against canonical content and targeted source checks, not an independent audit of all product claims.

| Locale | Naturalness | Technical accuracy | Terminology | Resource completeness |
|---|---|---|---|---|
| en | Fluent canonical developer prose | Baseline reviewed; two clarifications implemented | Consistent | Complete resources |
| pt-BR | Natural, direct developer Portuguese | Faithful after independent corrections | Consistent, normal technical loans retained | Complete resources |
| es | Strong neutral developer Spanish | Faithful after independent corrections | Builder/hydration/form terms aligned | Complete resources |
| fr | Natural technical French | Type safety/standalone semantics restored | Consistent; contextual loans retained | Complete resources |
| it | Strong developer-facing Italian | Faithful after independent corrections | Builders/routing/CSS aligned | Complete resources |
| de | Generally natural technical German | Error/loading/lifecycle distinctions corrected | Consistent, accepted loans retained | Complete resources |
| ja | Clear technical Japanese | Loading/lifecycle/region semantics corrected | Consistent | Complete resources |
| zh-CN | Strong, concise technical Chinese | Identity, modifiers and domain terms checked | Consistent | Complete resources |
| ko | Substantially improved, idiomatic technical prose | Material omissions/inversions corrected independently | Improved; some acceptable stylistic alternatives remain | Complete resources |
| ar | Clear technical Modern Standard Arabic after final polish | Reversed/omitted claims corrected independently | Generally consistent; normal technical passive voice retained | Complete resources |
| ru | Generally natural developer Russian | Routing/SSR/lifecycle meanings corrected independently | Consistent; occasional verbosity remains | Complete resources |
| hi | Substantially improved developer Hindi | Negation and lifecycle/API qualifiers restored independently | Familiar developer terms retained | Complete resources |

Editorial ratings are model judgments, not native-speaker certification or evidence of human review. Structural completeness and invariant preservation are automated findings within the resources above, not a claim that every interactive demo is translated. Product/performance claims and external benchmark results were preserved; their factual validity was not independently audited here.
