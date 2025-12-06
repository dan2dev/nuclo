# Nuclo SSR (Server-Side Rendering)

Server-side rendering utilities for Nuclo that allow you to render components to HTML strings in Node.js environments.

## Installation

The SSR module is included in the main `nuclo` package:

```bash
npm install nuclo
```

## Usage

### Basic Example

```typescript
// Load polyfills first for Node.js environment
import 'nuclo/polyfill';

// Import SSR function
import { renderToString } from 'nuclo/ssr';

// Import component builders
import { div, h1, p } from 'nuclo';

// Render a component to HTML string
const html = renderToString(
  div({ class: "container" },
    h1("Hello, World!"),
    p("This is server-side rendered content.")
  )
);

console.log(html);
// Output: <div class="container"><h1>Hello, World!</h1><p>This is server-side rendered content.</p></div>
```

### CommonJS Example

```javascript
// Load polyfills
require('nuclo/dist/nuclo.cjs');

// Load SSR module
const { renderToString } = require('nuclo/dist/ssr/nuclo.ssr.cjs');

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
- `input` - A Nuclo component function, DOM element, or node

**Returns:** `string` - HTML string representation

**Example:**
```typescript
const html = renderToString(div("Hello"));
// Returns: '<div>Hello</div>'
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
// Returns: ['<div>First</div>', '<div>Second</div>', '<div>Third</div>']
```

### `renderToStringWithContainer(input, containerTag, containerAttrs)`

Renders a component and wraps it in a container element.

**Parameters:**
- `input` - A Nuclo component
- `containerTag` (optional) - Tag name for container (default: 'div')
- `containerAttrs` (optional) - Attributes for the container

**Returns:** `string` - HTML string with container wrapper

**Example:**
```typescript
const html = renderToStringWithContainer(
  span("Content"),
  "section",
  { id: "main", class: "wrapper" }
);
// Returns: '<section id="main" class="wrapper"><span>Content</span></section>'
```

## Features

-  Renders all HTML and SVG elements
-  Handles attributes and properties
-  Supports nested components
-  Escapes HTML to prevent XSS
-  Handles void elements correctly (br, img, input, etc.)
-  Works with both ES modules and CommonJS

## Important Notes

1. **Polyfills Required**: Always import polyfills before using SSR in Node.js:
   ```typescript
   import 'nuclo/polyfill';
   ```

2. **Global vs Module Imports**: Tag builders are available globally after importing the main module:
   ```typescript
   import 'nuclo';  // Makes div, span, etc. available globally
   ```

3. **Reactive Features**: SSR renders the initial state only. Reactive features will not work in server-rendered HTML.

4. **Event Handlers**: Event handlers will not be included in the rendered HTML string.

## Example: Express.js Integration

```typescript
import express from 'express';
import 'nuclo/polyfill';
import { renderToString } from 'nuclo/ssr';
import { div, h1, p } from 'nuclo';

const app = express();

app.get('/', (req, res) => {
  const html = renderToString(
    div({ class: "container" },
      h1("Welcome"),
      p("Server-rendered with Nuclo!")
    )
  );

  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Nuclo SSR</title></head>
      <body>${html}</body>
    </html>
  `);
});

app.listen(3000);
```

## Package Configuration

The SSR module is configured in `package.json` exports:

```json
{
  "exports": {
    "./ssr": {
      "types": "./dist/ssr/index.d.ts",
      "import": "./dist/ssr/nuclo.ssr.js",
      "require": "./dist/ssr/nuclo.ssr.cjs"
    }
  }
}
```

## Build Configuration

The SSR bundle is built separately in `rollup.config.js`:

```javascript
const ssrConfig = {
  input: 'src/ssr/index.ts',
  output: [
    {
      file: 'dist/ssr/nuclo.ssr.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/ssr/nuclo.ssr.cjs',
      format: 'cjs',
      sourcemap: true,
    },
  ],
};
```
