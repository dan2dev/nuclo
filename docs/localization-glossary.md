# Nuclo terminology review

Evidence: packages/nuclo-core/README.md:3–15; docs/src/i18n/en/docs.ts:19–44, 161–165. English is canonical (i18n/index.ts:6). Nuclo registers functions for state-dependent values; mutating state itself does not synchronize DOM; update() reevaluates those functions and applies changed values directly to real DOM. No automatic dependency tracking, proxies, signals, virtual DOM, or reconciliation. Fine-grained/targeted refers to DOM changes, not automatically scheduled computation. Builders are deferred element-creation functions, not classes or JavaScript constructors. Rendering/mounting is distinct from later patching.

Working glossary for editors (editorial recommendations; no claim of human native-speaker certification):

|Locale|Explicit updates|Mutable state|Type safety|Tag builders|Lifecycle|Rendering|Routing|Targeted DOM updates|
|---|---|---|---|---|---|---|---|---|
|en|explicit updates|mutable state|type safety|tag builders|lifecycle|rendering|routing|targeted DOM updates|
|pt-BR|atualizações explícitas|estado mutável|segurança de tipos|funções de criação de tags / builders de tags|ciclo de vida|renderização|roteamento|atualizações pontuais do DOM|
|es|actualizaciones explícitas|estado mutable|seguridad de tipos|funciones constructoras de etiquetas|ciclo de vida|renderizado|enrutamiento|actualizaciones precisas del DOM|
|fr|mises à jour explicites|état mutable|sécurité des types|fonctions de création de balises|cycle de vie|rendu|routage|mises à jour ciblées du DOM|
|it|aggiornamenti espliciti|stato mutabile|sicurezza dei tipi|builder di tag|ciclo di vita|rendering|routing|aggiornamenti mirati del DOM|
|de|explizite Updates|veränderbarer Zustand / State|Typsicherheit|Tag-Builder|Lebenszyklus|Rendering|Routing|gezielte DOM-Updates|
|ja|明示的な更新|変更可能な状態|型安全性|タグビルダー|ライフサイクル|レンダリング|ルーティング|DOM の必要な箇所だけを更新|
|zh-CN|显式更新|可变状态|类型安全|标签构建函数|生命周期|渲染|路由|精准更新 DOM|
|ko|명시적 업데이트|변경 가능한 상태|타입 안전성|태그 빌더|생명주기|렌더링|라우팅|필요한 DOM만 업데이트|
|ar|تحديثات صريحة|حالة قابلة للتغيير|أمان الأنواع|دوال بناء الوسوم|دورة الحياة|التصيير|التوجيه|تحديث الأجزاء المتغيرة من DOM|
|ru|явные обновления|изменяемое состояние|типобезопасность|функции построения элементов|жизненный цикл|рендеринг|маршрутизация|точечные обновления DOM|
|hi|स्पष्ट अपडेट|बदला जा सकने वाला स्टेट|टाइप सुरक्षा|टैग बिल्डर|लाइफ़साइकल|रेंडरिंग|रूटिंग|DOM के ज़रूरी हिस्सों को अपडेट करना|

Keep Nuclo, nuclo, DOM, HTML, SVG, TypeScript, SSR, CSS, API identifiers, CLI commands, imports, paths unchanged. Proxy/signals are recognizable English loans or established local equivalents; do not translate to network proxy or OS signals accidentally. Virtual DOM: DOM virtual (pt/es/fr), DOM virtuale (it), virtuelles DOM (de), 仮想 DOM (ja), 虚拟 DOM (zh), 가상 DOM (ko), DOM افتراضي (ar), виртуальный DOM (ru), वर्चुअल DOM (hi). Reactive: reativo/reactivo/réactif/reattivo/reaktiv/リアクティブ/响应式/반응형/تفاعلي/реактивный/रिएक्टिव; distinguish reactive UI programming from responsive layout.

Terminology guidance was also checked against localized primary developer documentation. These references support language usage, not Nuclo behavior: [Portuguese](https://pt-br.react.dev/learn/state-a-components-memory), [Spanish](https://es.react.dev/learn/state-a-components-memory), [French](https://fr.react.dev/learn/state-a-components-memory), [Italian](https://it.react.dev/learn/state-a-components-memory), [Japanese](https://ja.react.dev/learn/state-a-components-memory), [Simplified Chinese](https://zh-hans.react.dev/learn/state-a-components-memory), [Korean](https://ko.react.dev/learn/state-a-components-memory), [Hindi](https://hi.react.dev/learn/state-a-components-memory), [Arabic](https://ar.vuejs.org/guide/essentials/reactivity-fundamentals.html), [German DOM glossary](https://developer.mozilla.org/de/docs/Glossary/DOM), [Russian DOM glossary](https://developer.mozilla.org/ru/docs/Glossary/DOM). MDN marks its current German page as automatically translated; use it only as a terminology cross-check, not evidence of native editorial quality.

These are working editorial preferences, not mandatory word-for-word replacements. Context determines whether a borrowed technical term or a short explanation is clearer. In particular, state-dependent evaluation is not automatic reactivity, and DOM patching is not component rendering. Keep code, command syntax and inline API placeholders in canonical form.


Additional shared concepts: components are plain functions (componentes / composants / componenti / Komponenten / コンポーネント / 组件 / 컴포넌트 / مكونات / компоненты / कंपोनेंट). A component function and a tag builder are related but distinct; a builder is a deferred creation function, not a constructed DOM node. Rendering/mounting builds or attaches a tree; later DOM patching writes changed values. Type checking is the compiler checking types; type safety names the property of the typed API. Keep those distinctions when a shorter localized term could blur them.

Performance/benchmarks: benchmarks or testes de desempenho (pt-BR), pruebas de rendimiento (es), benchmarks or tests de performance (fr), benchmark (it/de), ベンチマーク (ja), 基准测试 (zh-CN), 벤치마크 (ko), اختبارات الأداء (ar), бенчмарки or тесты производительности (ru), बेंचमार्क (hi). Preserve keyed/non-keyed implementation names, weighted geometric mean, slowdown ratios, versions, units and the direction of comparison. “Lower is better” describes the duration ratio, not a percentage improvement.
