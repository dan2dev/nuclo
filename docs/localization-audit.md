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
- No routes, public APIs, dependencies, example logic or application update behavior were changed. No commits were made.

## Editorial coverage by locale

Every translated locale: all seven resource files reviewed; six text files edited in each locale except Russian (five, with ui.ts retained). Bundle indexes retained. Areas reviewed: homepage/headlines, documentation/API/router/SSR, example metadata, UI/accessibility, errors and SEO. English resources were used as the semantic baseline; the shop's English free-shipping copy was clarified to match its existing inclusive threshold (`subtotal() >= FREE_OVER`).

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
| Hindi | Editorial review in progress | All 7 assigned | Shared demo/code scope above |

Representative before/after examples (semantic corrections and editorial judgments, not human certification):

| Locale | Before | After |
|---|---|---|
| English | Free shipping over … | Free shipping on orders of … or more. |
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

The already multilingual shop also preserves product facts (Japanese cast-iron teapot no longer asserts Nambu provenance; shipped order no longer becomes merely received), improves Portuguese add-to-cart/raw-honey copy, and clarifies Arabic cocoa composition and quantity controls. German `ab` and Japanese `以上` correctly match the existing inclusive free-shipping threshold and were retained.

## Independent quality assurance

<!-- QA_REPORT -->

## Validation

<!-- VALIDATION_REPORT -->

## Assessment

Editorial ratings are model judgments, not native-speaker certification or evidence of human review. Structural completeness and invariant preservation are automated findings within the resources above, not a claim that every interactive demo is translated. Product/performance claims and external benchmark results were preserved; their factual validity was not independently audited here.
