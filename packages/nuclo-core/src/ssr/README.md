# Nuclo SSR (Server-Side Rendering)

Server-side rendering utilities for Nuclo that allow you to render components to HTML strings in Node.js, Bun and Deno.

## Installation

The SSR module is included in the main `nuclo` package:

```bash
npm install nuclo
```

## Usage

### Basic Example

```typescript
// Load the DOM polyfill first for server runtimes
import 'nuclo/polyfill';

// Register the global tag builders (div, h1, p, …).
// Tag builders are globals only: `import { div } from 'nuclo'` does not work.
import 'nuclo';

// Import SSR function
import { renderToString } from 'nuclo/ssr';

// Render a component to HTML string
const html = renderToString(
  div({ className: "container" },
    h1("Hello, World!"),
    p("This is server-side rendered content.")
  )
);

console.log(html);
// Output: <div class="container"><h1><!-- text-0 -->Hello, World!</h1><p><!-- text-1 -->This is server-side rendered content.</p></div>
```

### CommonJS Example

```javascript
// Load the DOM polyfill
require('nuclo/polyfill');

// Register the global tag builders
require('nuclo');

// Load SSR module
const { renderToString } = require('nuclo/ssr');

// Use global tag builders
const html = renderToString(
  div({ id: "app" },
    h1("My App"),
    p("Content here")
  )
);
```

## API

### `renderToString(input)`

Renders a Nuclo component to an HTML string.

**Parameters:**
- `input` - A built tree (`App()`), a component function (`App`, as `render()`/`hydrate()` take it), a DOM element, or a node

**Returns:** `string` - HTML string representation

**Example:**
```typescript
const html = renderToString(div("Hello"));
// Returns: '<div><!-- text-0 -->Hello</div>'
```

### `renderManyToString(inputs)`

Renders multiple Nuclo components to HTML strings.

**Parameters:**
- `inputs` - Array of Nuclo components

**Returns:** `string[]` - Array of HTML strings

**Example:**
```typescript
const htmlArray = renderManyToString([
  div("First"),
  div("Second"),
  div("Third")
]);
// Returns: ['<div><!-- text-0 -->First</div>', '<div><!-- text-0 -->Second</div>', '<div><!-- text-0 -->Third</div>']
```

### `renderToStringWithContainer(input, containerTag, containerAttrs)`

Renders a component and wraps it in a container element.

**Parameters:**
- `input` - A Nuclo component
- `containerTag` (optional) - Tag name for container (default: 'div')
- `containerAttrs` (optional) - Attributes for the container. Names are written as given, so use HTML names such as `class`.

**Returns:** `string` - HTML string with container wrapper

**Example:**
```typescript
const html = renderToStringWithContainer(
  span("Content"),
  "section",
  { id: "main", class: "wrapper" }
);
// Returns: '<section id="main" class="wrapper"><span><!-- text-0 -->Content</span></section>'
```

## Features

- Renders all HTML and SVG elements
- Handles attributes and properties
- Supports nested components
- Escapes HTML to prevent XSS
- Handles void elements correctly (`br`, `img`, `input`, etc.)
- Works with both ES modules and CommonJS

## Important Notes

1. **Polyfills Required**: Always import polyfills before using SSR in Node.js:
   ```typescript
   import 'nuclo/polyfill';
   ```

2. **Global vs Module Imports**: Tag builders are available globally after importing the main module:
   ```typescript
   import 'nuclo';  // Makes div, span, etc. available globally
   ```

3. **Explicit Update Cycle**: SSR renders the current state only. Dynamic functions are evaluated once during string generation, and the HTML will not keep updating on the server.

4. **Event Handlers**: Event handlers will not be included in the rendered HTML string.

5. **Hydration Markers**: The output contains HTML comments such as `<!-- text-0 -->`. `hydrate()` needs them, so do not strip comments from the server HTML.

## Example: Express.js Integration

```typescript
import express from 'express';
import 'nuclo/polyfill';
import 'nuclo';
import { renderToString, getCssText } from 'nuclo/ssr';

const app = express();

app.get('/', (req, res) => {
  const html = renderToString(
    div({ className: "container" },
      h1("Welcome"),
      p("Server-rendered with Nuclo!")
    )
  );

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Nuclo SSR</title>
        <style id="nuclo-styles">${getCssText()}</style>
      </head>
      <body>${html}</body>
    </html>
  `);
});

app.listen(3000);
```

Keep `id="nuclo-styles"` on the style tag. The client reuses that element and adds only new rules; without the id it injects a second stylesheet with every rule again.

## Build

The SSR bundle is built by tsdown (see `tsdown.config.ts`) to `dist/ssr/nuclo.ssr.mjs` and `dist/ssr/nuclo.ssr.cjs`, and exposed as the `nuclo/ssr` export in `package.json`.
