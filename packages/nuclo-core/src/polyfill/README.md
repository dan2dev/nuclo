# Nuclo Polyfills

Minimal polyfills that let Nuclo run in Node.js environments for Server-Side Rendering (SSR).

## Implemented APIs

### Document
- ✅ `document.createElement()`
- ✅ `document.createElementNS()` (for SVG)
- ✅ `document.createTextNode()`
- ✅ `document.createComment()`
- ✅ `document.createDocumentFragment()`
- ✅ `document.head`
- ✅ `document.body`
- ✅ `document.contains()` (always `false`)
- ⚪ `document.querySelector()` / `querySelectorAll()` — stubs (`null` / empty list)
- ⚪ `document.addEventListener()` / `removeEventListener()` / `dispatchEvent()` — no-ops (SSR does not dispatch events)

### Element
- ✅ `element.tagName`
- ✅ `element.children` / `element.childNodes` (the same array: elements, text nodes and comments)
- ✅ `element.className`
- ✅ `element.classList` (add, remove, toggle, contains, replace, item, iteration…)
- ✅ `element.id`
- ✅ `element.style` (lightweight object with `setProperty`, `getPropertyValue` and `cssText`)
- ✅ `element.textContent`
- ✅ `element.parentNode`
- ✅ `element.namespaceURI` (for SVG elements)
- ✅ `element.setAttribute()` / `getAttribute()` / `removeAttribute()` / `hasAttribute()`
- ✅ `element.appendChild()` / `insertBefore()` / `removeChild()` / `replaceChild()`
- ⚪ `element.querySelector()` / `querySelectorAll()` — stubs (`null` / empty list)
- ⚪ `element.addEventListener()` / `removeEventListener()` / `dispatchEvent()` — no-ops

### Text
- ✅ `textNode.data`
- ✅ `textNode.textContent`
- ✅ `textNode.nodeValue`
- ✅ `textNode.nodeType`
- ✅ `textNode.nodeName`
- ✅ `textNode.parentNode`

### Event & CustomEvent
Re-exported as the runtime's native constructors (Node >= 19, Bun, Deno).

## Limitations
- To generate HTML, use `renderToString()` (from `nuclo/ssr`); the polyfill has no `innerHTML` and no selector queries.
- `window`, `navigator`, `localStorage`, `CSSStyleSheet`, etc. are not implemented — CSS generated on the server comes out through `getCssText()`.

## Usage

### Automatic Import
```typescript
import 'nuclo/polyfill';
// Polyfills are applied to globalThis automatically
```

### Manual Import
```typescript
import { document, Event, CustomEvent } from 'nuclo/polyfill';
```

## Using with linkedom

For real SSR with a full DOM, [linkedom](https://github.com/WebReflection/linkedom) is recommended:

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

Nuclo's polyfills are intended only for basic SSR scenarios where a full DOM is not needed.
