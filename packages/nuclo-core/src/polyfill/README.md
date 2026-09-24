# Nuclo Polyfills

Polyfills mínimos para permitir que Nuclo funcione em ambientes Node.js para Server-Side Rendering (SSR).

## APIs Implementadas

### Document
- ✅ `document.createElement()`
- ✅ `document.createElementNS()` (para SVG)
- ✅ `document.createTextNode()`
- ✅ `document.createComment()`
- ✅ `document.createDocumentFragment()`
- ✅ `document.head`
- ✅ `document.body`
- ✅ `document.contains()` (sempre `false`)
- ⚪ `document.querySelector()` / `querySelectorAll()` — stubs (`null` / lista vazia)
- ⚪ `document.addEventListener()` / `removeEventListener()` / `dispatchEvent()` — no-ops (SSR não despacha eventos)

### Element
- ✅ `element.tagName`
- ✅ `element.children` / `element.childNodes` (o mesmo array: elementos, textos e comentários)
- ✅ `element.className`
- ✅ `element.classList` (add, remove, toggle, contains, replace, item, iteração…)
- ✅ `element.id`
- ✅ `element.style` (objeto leve com `setProperty`, `getPropertyValue` e `cssText`)
- ✅ `element.textContent`
- ✅ `element.parentNode`
- ✅ `element.namespaceURI` (para elementos SVG)
- ✅ `element.setAttribute()` / `getAttribute()` / `removeAttribute()` / `hasAttribute()`
- ✅ `element.appendChild()` / `insertBefore()` / `removeChild()` / `replaceChild()`
- ⚪ `element.querySelector()` / `querySelectorAll()` — stubs (`null` / lista vazia)
- ⚪ `element.addEventListener()` / `removeEventListener()` / `dispatchEvent()` — no-ops

### Text
- ✅ `textNode.data`
- ✅ `textNode.textContent`
- ✅ `textNode.nodeValue`
- ✅ `textNode.nodeType`
- ✅ `textNode.nodeName`
- ✅ `textNode.parentNode`

### Event & CustomEvent
Reexportados como os construtores nativos do runtime (Node >= 19, Bun, Deno).

## Limitações
- Para gerar HTML use `renderToString()` (de `nuclo/ssr`); o polyfill não tem `innerHTML` nem consultas por seletor.
- `window`, `navigator`, `localStorage`, `CSSStyleSheet` etc. não estão implementados — o CSS gerado no servidor sai por `getCssText()`.

## Uso

### Importação Automática
```typescript
import 'nuclo/polyfill';
// Polyfills são aplicados automaticamente ao globalThis
```

### Importação Manual
```typescript
import { document, Event, CustomEvent } from 'nuclo/polyfill';
```

## Para uso com linkedom

Para SSR real com DOM completo, recomenda-se usar [linkedom](https://github.com/WebReflection/linkedom):

```typescript
import { parseHTML } from 'linkedom';

const { document, customElements, HTMLElement } = parseHTML(`
  <!DOCTYPE html>
  <html>
    <head></head>
    <body></body>
  </html>
`);

globalThis.document = document;
globalThis.HTMLElement = HTMLElement;
globalThis.customElements = customElements;
```

Os polyfills do Nuclo são destinados apenas para cenários básicos de SSR onde um DOM completo não é necessário.
