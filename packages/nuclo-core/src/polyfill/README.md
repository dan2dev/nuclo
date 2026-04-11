# Nuclo Polyfills

Polyfills mínimos para permitir que Nuclo funcione em ambientes Node.js para Server-Side Rendering (SSR).

## APIs Implementadas

### Document
- ✅ `document.createElement()`
- ✅ `document.createElementNS()` (para SVG)
- ✅ `document.createTextNode()`
- ✅ `document.createComment()`
- ✅ `document.querySelector()` (implementação básica para `#nuclo-styles`)
- ✅ `document.querySelectorAll()`
- ✅ `document.head`
- ✅ `document.body`
- ✅ `document.addEventListener()`
- ✅ `document.removeEventListener()`
- ✅ `document.dispatchEvent()`
- ✅ `document.contains()`

### Element
- ✅ `element.tagName`
- ✅ `element.children`
- ✅ `element.className`
- ✅ `element.classList` (add, remove, toggle, contains, etc.)
- ✅ `element.id`
- ✅ `element.style` (implementação básica com Proxy)
- ✅ `element.textContent`
- ✅ `element.innerHTML`
- ✅ `element.parentNode`
- ✅ `element.setAttribute()`
- ✅ `element.getAttribute()`
- ✅ `element.removeAttribute()`
- ✅ `element.hasAttribute()`
- ✅ `element.appendChild()`
- ✅ `element.insertBefore()`
- ✅ `element.removeChild()`
- ✅ `element.replaceChild()`
- ✅ `element.addEventListener()`
- ✅ `element.removeEventListener()`
- ✅ `element.dispatchEvent()`
- ✅ `element.querySelector()` (retorna null)
- ✅ `element.querySelectorAll()` (retorna array vazio)
- ✅ `element.namespaceURI` (para elementos SVG)
- ✅ `element.sheet` (para `<style>` elements - implementação básica de CSSStyleSheet)

### Text
- ✅ `textNode.data`
- ✅ `textNode.textContent`
- ✅ `textNode.nodeValue`
- ✅ `textNode.nodeType`
- ✅ `textNode.nodeName`
- ✅ `textNode.parentNode`

### Event & CustomEvent
- ✅ `new Event(type, options)`
- ✅ `new CustomEvent(type, options)`
- ✅ `event.type`
- ✅ `event.bubbles`
- ✅ `event.cancelable`
- ✅ `event.detail` (CustomEvent)
- ✅ `event.preventDefault()`
- ✅ `event.stopPropagation()`

## APIs do Browser que ainda NÃO funcionam

### CSSStyleSheet (parcial)
O `element.sheet` tem uma implementação **muito básica** que:
- ✅ Suporta `insertRule()` e `deleteRule()`
- ✅ Mantém um array de `cssRules`
- ❌ **NÃO** suporta `CSSMediaRule`, `CSSContainerRule`, `CSSSupportsRule`
- ❌ **NÃO** suporta parsing real de CSS
- ❌ **NÃO** suporta `media.mediaText` ou `conditionText`

Isso significa que em Node.js:
- ✅ O código que **cria** estilos vai funcionar sem erros
- ❌ O código que **verifica** media queries/container queries vai falhar

### Outras limitações
- `querySelector()` e `querySelectorAll()` são implementações stub (retornam null/array vazio)
- `window`, `navigator`, `localStorage`, etc. não estão implementados
- DOM event propagation é simplificado (sem capturing phase)

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
