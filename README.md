# nuclo

**A lightweight, type-safe DOM framework for JavaScript and TypeScript. State stays plain and mutable. You control every update.**

Create elements with plain functions. Pass a function anywhere a value depends on state. Nuclo registers that function and can run it again later. Change your JavaScript values directly. Then call `update()` to make Nuclo synchronize the DOM. Nuclo has no virtual DOM, no proxies, no signals, and no automatic state tracking.

Nuclo's workflow has three steps:

1. **Create the UI with builder functions.** Pass a function for text, an attribute, a condition, or a list whenever it depends on state. Nuclo registers that function as a state-dependent value.
2. **Mutate regular JavaScript state.** Nuclo uses no signals, no proxies, and no wrapped values. `count++` stays `count++`. Mutating state does not touch the DOM by itself.
3. **Call `update()`.** This step starts synchronization. Nuclo reevaluates the state-dependent values from step 1 and applies the changed results to the real DOM.

```ts
import 'nuclo';

let count = 0;

const counter = div(
  h1(() => `Count: ${count}`),
  button('Increment', { onClick: () => {
    count++;
    update();
  } })
);

render(counter, document.body);
```

## Why nuclo?

- **State-dependent values** – Pass a function for any text, attribute, condition, or list that depends on state. Nuclo can run it again later.
- **Explicit and predictable** – Mutation alone does not trigger reevaluation. You trigger it yourself with an `update()` call.
- **Real DOM, no virtual layer** – Nuclo creates and updates real DOM nodes directly. There is no virtual DOM to diff.
- **Small runtime** – About 15 KB gzipped for the entire runtime. Zero dependencies.
- **Global tag builders** – Global functions cover every HTML and SVG element.
- **TypeScript-first** – Full type definitions cover all 175 HTML and SVG builders.
- **Targeted DOM updates** – `update()` re-runs registered state-dependent values. It touches the DOM only where a value changed.
- **Atomic styling** – Built-in `css()` and `createCss()` give TypeScript autocomplete, theming, and SSR CSS collection.
- **Server-side rendering** – `renderToString()` and `hydrate()` work together with a lightweight DOM polyfill.

---

## Quick Start

Scaffold a new Nuclo + Vite project with a single command:

```bash
# npm
npm create nuclo@latest

# pnpm
pnpm create nuclo

# yarn
yarn create nuclo

# bun
bun create nuclo

# deno
deno run -A npm:create-nuclo
```

Follow the prompts to choose a project name and template. Or skip the prompts:

```bash
npm create nuclo@latest my-app -- --template basic --yes
```

```bash
cd my-app
npm install
npm run dev
```

## Installation

To add Nuclo to an existing project, install it:

```bash
npm install nuclo
```

### Usage

Import Nuclo once. This registers all global functions:

```ts
import 'nuclo';

// Now use div(), update(), on(), list(), when(), render(), etc. globally
let count = 0;
const app = div(
  h1(() => `Count: ${count}`),
  button('Click', { onClick: () => { count++; update(); } })
);
render(app, document.body);
```

### TypeScript Setup

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}
```

Or in your `vite-env.d.ts`:

```ts
/// <reference types="nuclo/types" />
```

---

## Quick Examples

### Counter

```ts
import 'nuclo';

let count = 0;

const app = div(
  h1(() => `Count: ${count}`),
  button('Increment', { onClick: () => { count++; update(); } }),
  button('Reset', { onClick: () => { count = 0; update(); } })
);

render(app, document.body);
```

### Todo List

```ts
import 'nuclo';

type Todo = { id: number; text: string; done: boolean };

let todos: Todo[] = [];
let nextId = 1;
let inputValue = '';

function addTodo() {
  if (!inputValue.trim()) return;
  todos.push({ id: nextId++, text: inputValue, done: false });
  inputValue = '';
  update();
}

const app = div(
  { className: 'todo-app' },

  // Input
  div(
    input({ value: () => inputValue },
      on('input', e => { inputValue = e.target.value; update(); }),
      on('keydown', e => e.key === 'Enter' && addTodo())
    ),
    button('Add', { onClick: addTodo })
  ),

  // List
  when(() => todos.length > 0,
    list(() => todos, (todo) =>
      div(
        { className: () => todo.done ? 'done' : '' },
        input({ type: 'checkbox', checked: () => todo.done },
          on('change', () => { todo.done = !todo.done; update(); })
        ),
        span(() => todo.text),
        button('×', { onClick: () => {
          todos = todos.filter(t => t.id !== todo.id);
          update();
        } })
      )
    )
  ).else(
    p('No todos yet!')
  )
);

render(app, document.body);
```

### Real-time Search Filter

```ts
import 'nuclo';

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
];

let searchQuery = '';

function filteredUsers() {
  const q = searchQuery.toLowerCase();
  return users.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
}

const app = div(
  h1('User Directory'),

  input(
    {
      type: 'search',
      placeholder: 'Search users...',
      value: () => searchQuery
    },
    on('input', e => {
      searchQuery = e.target.value;
      update();
    })
  ),

  when(() => filteredUsers().length > 0,
    list(() => filteredUsers(), user =>
      div(
        { className: 'user-card' },
        h3(user.name),
        p(user.email)
      )
    )
  ).else(
    p(() => `No users found for "${searchQuery}"`)
  )
);

render(app, document.body);
```

### Loading States & Async

```ts
import 'nuclo';

type Product = { id: number; title: string; category: string };
type State = { status: 'idle' | 'loading' | 'error'; products: Product[]; error?: string };

let state: State = { status: 'idle', products: [] };
let searchQuery = 'phone';

async function fetchProducts() {
  if (!searchQuery.trim()) return;

  state.status = 'loading';
  update();

  try {
    const response = await fetch(`https://dummyjson.com/products/search?q=${searchQuery}`);
    const data = await response.json();
    state.products = data.products;
    state.status = 'idle';
  } catch (err) {
    state.status = 'error';
    state.error = err.message;
  }
  update();
}

const app = div(
  div(
    input(
      {
        type: 'search',
        placeholder: 'Search products...',
        value: () => searchQuery
      },
      on('input', e => {
        searchQuery = e.target.value;
        update();
      }),
      on('keydown', e => e.key === 'Enter' && fetchProducts())
    ),
    button('Search', { onClick: fetchProducts })
  ),

  when(() => state.status === 'loading',
    div('Loading...')
  ).when(() => state.status === 'error',
    div({ className: 'error' }, () => `Error: ${state.error}`)
  ).when(() => state.products.length > 0,
    list(() => state.products, product =>
      div(
        { className: 'product-card' },
        h3(product.title),
        p(() => `Category: ${product.category}`)
      )
    )
  ).else(
    div('Click search to load products')
  )
);

render(app, document.body);
```

---

## Core Concepts

**The mental model:**

1. Create the UI with builder functions, such as `h1(...)`, `when()`, and `list()`.
2. Use functions for values that depend on state, such as `h1(() => \`Count: ${count}\`)`. This registers a state-dependent value.
3. Mutate regular JavaScript state, such as `count++`.
4. Call `update()`.
5. Nuclo reevaluates the registered state-dependent values and applies the changes to the existing DOM.

State mutation and the `update()` call are plain JavaScript. You write `count++` and call `update()` yourself. Nuclo does not watch your variables. Nothing reevaluates until `update()` runs. The function from step 2 stays registered, so Nuclo can evaluate it again. Only `update()` starts that evaluation.

### 1. **Explicit Updates**

Nuclo does not auto-detect changes. You call `update()` when you are ready:

```ts
let name = 'World';

// Mutate freely
name = 'Alice';
name = name.toUpperCase();

// Update once when ready
update();
```

**Advantages of explicit `update()`:**

- **Performance** – Batch multiple mutations into a single update cycle.
- **Control** – You decide exactly when the UI refreshes.
- **Predictability** – No surprise re-renders. The update flow stays explicit.
- **Simplicity** – No proxies and no dependency graphs. Only objects and functions.
- **Debugging** – Set a breakpoint at `update()` to trace every state change.

```ts
// Example: Batch updates for better performance
items.push(item1);
items.push(item2);
items.sort();
user.name = 'Alice';
update();  // One update for all changes

// vs. automatic tracking (hypothetical)
items.push(item1);  // triggers update
items.push(item2);  // triggers update
items.sort();       // triggers update
user.name = 'Alice'; // triggers update
// 4 updates instead of 1!
```

### 2. **Dynamic Functions**

A zero-argument function becomes a state-dependent value. Nuclo keeps it registered and can evaluate it again. Nuclo evaluates it only when you call `update()`. Mutating the state it reads does nothing on its own:

```ts
let count = 0;

div(
  () => `Count: ${count}`,  // Updates when update() is called
  { title: () => `Current: ${count}` }  // Attributes too
)
```

### 3. **Conditional Rendering with `when`**

First matching condition wins:

```ts
when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('User Dashboard')
).else(
  div('Please log in')
)
```

The DOM stays unchanged if the active branch does not change.

### 4. **List Synchronization**

Lists track items by object identity, not by keys:

```ts
list(() => items, (item, index) =>
  div(() => `${index}: ${item.name}`)
)
```

Mutate the array with `push`, `splice`, or `reverse`. Then call `update()`. Nuclo reuses an element when the item reference stays the same.

## API Reference

### Core Functions

#### `update()`

Runs one synchronous update pass across every dynamic binding. Call `update()` after you mutate state:

```ts
count++;
items.push(newItem);
update();
```

#### `list(provider, renderer)`

Synchronizes an array to DOM elements:

```ts
list(
  () => items,           // Provider function
  (item, index) => div(  // Renderer
    () => `${index}: ${item.name}`
  )
)
```

Nuclo tracks items by object identity. Mutate the array and call `update()` to sync.

#### `when(condition, ...content)`

Renders content conditionally. Chain branches with `.when()` and `.else()`:

```ts
when(() => count > 10,
  div('High')
).when(() => count > 0,
  div('Low')
).else(
  div('Zero')
)
```

The first matching condition wins. The DOM stays unchanged if the active branch does not change.

#### Events

Attach event listeners with camelCase `on*` attribute props, such as `onClick`, `onInput`, `onChange`, and `onKeyDown`. In an attribute object, a key that matches a known event and holds a function value is registered as a listener, not as a reactive attribute:

```ts
button('Remove', { className: 'remove', onClick: () => doDelete(row.id) })
```

This is the preferred way to wire up events. It reads well inside object literals, such as row templates in a `list()`.

Use the `on(event, handler, options?)` helper instead in two cases: when an element needs multiple listeners for the same event type, or when you need to pass listener `options` such as `{ passive: true }`:

```ts
button('Click me',
  on('click', trackClick),
  on('click', logClick, { passive: true })
)
```

#### `scope(...ids)`

Registers an element as a named update root. After this, `update("id")` re-runs only the dynamic bindings inside that root, not the whole page:

```ts
div(
  scope('cart'),
  span(() => `Items: ${cartItems.length}`)
)

cartItems.push(nextItem);
update('cart'); // only updates runtimes inside the "cart" scope
```

### Tag Builders

All HTML and SVG tags are available globally:

```ts
div(), span(), button(), input(), h1(), p(), ul(), li()
svgSvg(), circleSvg(), pathSvg(), rectSvg(), gSvg()
// ... 175 HTML and SVG builders total
```

### Attributes

Pass attributes as objects:

```ts
div('Hello', {
  className: 'container',
  id: 'main',
  'data-test': 'value',
  style: { color: 'red', fontSize: '16px' }
})
```

Dynamic attributes use functions:

```ts
div({
  className: () => isActive ? 'active' : '',
  disabled: () => !isValid,
  style: () => ({ opacity: isVisible ? 1 : 0 })
})
```

### Styling

Nuclo includes an atomic CSS-in-TS engine. `css()` is available globally after `import 'nuclo'`. Use `createCss()` for theming and responsive breakpoints:

```ts
import 'nuclo';

const { css } = createCss({
  colors: { primary: '#14b8a6' },
  screens: { md: '(min-width: 768px)' },
});

const card = css({
  p: 16,
  rounded: 8,
  md: { p: 24 },
  hover: { borderColor: 'primary' },
});

const el = div(card, 'Hello');
```

`css()` returns an object with a `className` key. Pass this object directly to any tag builder. For global styles and keyframe animations, use `globalStyle()` and `keyframes()`.

#### Composing with `cx()`

`cx()` composes styles and resolves conflicts with an exact, last-wins rule. The engine knows which declaration each class represents, so a later `color` atom drops the earlier one. No guessing is involved, unlike tools such as tailwind-merge. `cx()` accepts style results, raw class strings, falsy values, and nested arrays:

```ts
cx(base, isActive && activeStyle);          // conditional
cx([base, isActive && activeStyle], extra); // arrays are flattened
```

#### Typed variants with `variants()`

`variants()` turns a base style plus named variant groups into a strongly-typed recipe. Nuclo infers variant names and values, so selecting an unknown variant is a compile error. Select `true`/`false` value groups with real booleans. Every variant compiles to atomic classes once, at definition time. A call is a cached lookup plus a `cx()` merge.

```ts
import 'nuclo';

const { variants } = createCss({
  colors: { primary: '#6366f1', danger: '#ef4444' },
});

const button = variants({
  base: { rounded: 8, weight: 600, cursor: 'pointer' },
  variants: {
    intent: {
      primary: { bg: 'primary', color: '#fff' },
      danger:  { bg: 'danger',  color: '#fff' },
    },
    size: {
      sm: { px: 10, py: 6,  text: 14 },
      lg: { px: 18, py: 12, text: 16 },
    },
    block: { true: { display: 'block', w: '100%' } },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
  compoundVariants: [
    { intent: 'danger', size: 'lg', css: { weight: 700 } },
  ],
});

div(button({ intent: 'danger', size: 'lg' }), 'Delete'); // StyleResult — drop-in attributes
div(button(), 'Save');                                    // uses defaultVariants

button({ intent: 'ghost' }); // ✗ compile error: "ghost" is not a defined intent
```

The result is a `StyleResult`. Pass it directly to any tag builder, or compose it further with `cx(button({ size: 'lg' }), extraClass)`.

### Server-Side Rendering

In your Node.js server entry, import `nuclo/polyfill` before `nuclo`. Then use `renderToString()` and `getCssText()` from `nuclo/ssr`:

```ts
import 'nuclo/polyfill';
import 'nuclo';
import { renderToString, getCssText } from 'nuclo/ssr';
import { App } from './app.ts';

const html = renderToString(App());
const styles = getCssText();

const page = `<!doctype html><html><head><style>${styles}</style></head>
<body><div id="app">${html}</div></body></html>`;
```

On the client, call `hydrate()` instead of `render()`. This attaches Nuclo runtimes to the existing markup and does not re-create DOM nodes.

`nuclo/ssr` also exports two more functions. `renderManyToString(inputs)` renders a batch of trees at once. `renderToStringWithContainer(input, containerTag?, containerAttrs?)` wraps the output in a container element, without a second serialization pass.

---

## Best Practices

### Batch Updates

Make multiple changes, then update once:

```ts
// Efficient: One update for all changes
items.push(item1);
items.push(item2);
items.sort();
update();

// Works but inefficient: Multiple updates
items.push(item1);
update();
items.push(item2);
update();
```

### Object Identity for Lists

Lists track items by reference. Mutate objects in place:

```ts
// Good: Mutate the object
todos[0].done = true;
update();

// Avoid: Creates new object, DOM element recreated
todos[0] = { ...todos[0], done: true };
update();
```

### Use `.else()` for Clarity

Add `.else()` even when you do not need it yet. It states your intent clearly:

```ts
when(() => isLoading,
  div('Loading...')
).else(
  div('Ready')  // Clear intent
)
```

---

## Advanced Patterns

### Nested Structures

Combine `when` and `list`:

```ts
when(() => user.isLoggedIn,
  div(
    h1(() => `Welcome, ${user.name}`),
    list(() => user.notifications, n =>
      div(n.message, { className: () => n.read ? 'read' : 'unread' })
    )
  )
).else(
  div('Please log in')
)
```

### Component-like Functions

```ts
function UserCard(user: User) {
  return div(
    { className: 'user-card' },
    img({ src: user.avatar }),
    h3(user.name),
    p(user.bio)
  );
}

list(() => users, user => UserCard(user))
```

### Computed Values

```ts
function activeCount() {
  return todos.filter(t => !t.done).length;
}

div(
  () => `${activeCount()} remaining`
)
```

---

## Performance

- **No virtual DOM diffing** – Nuclo manipulates the DOM directly.
- **Fine-grained updates** – Nuclo updates only what changed.
- **Element reuse** – Lists reuse DOM elements when items move.
- **Branch preservation** – A conditional branch persists until its condition changes.

For high-frequency updates, such as animations and game loops, batch your mutations before you call `update()`.

---

## Debugging

### Inspect Markers

Open DevTools. Comment markers in the DOM show the structure:

```html
<!-- when-start-1 -->
<div>Content</div>
<!-- when-end -->

<!-- list-start-2 -->
<div>Item 1</div>
<div>Item 2</div>
<!-- list-end -->
```

These markers identify conditional and list boundaries in the DOM.

### Common Issues

**Content not updating?**
- Check that you call `update()` after every state change.
- Check that your dynamic functions return the expected values. A function that returns `null` or `undefined` renders as empty text. It fills in on the next `update()`.

**List items not reusing elements?**
- Keep object references stable. Mutate objects instead of replacing them.
- Avoid creating new objects when you update properties.

### Gotchas

**The parameter count decides what a function modifier means.**
A modifier with **zero declared parameters** is treated as dynamic text, or a dynamic `cn()` className, and Nuclo calls it with no arguments. A modifier with **one or more declared parameters** is a node-modifier function. Nuclo calls it with `(element, index)`. Default and rest parameters do not count as declared parameters, so `fn.length` is `0` for them. Nuclo treats all of these as *dynamic text*, not as node modifiers:

```ts
div((el = fallback) => el.id);   // dynamic text — el is undefined!
div((...args) => args[0]);       // dynamic text — args is empty!
div((el) => el.id = "x");        // node modifier — el is the element ✓
```

If a modifier needs the element, declare it as a plain required parameter.

**Detached nodes stop updating.**
When `update()` runs, Nuclo prunes the registered state-dependent values, such as text, attributes, `list()`, and `when()`, for any node disconnected from the DOM. Re-attaching the node later does **not** restore them. For keep-alive and portal-style patterns, rebuild content after you re-attach a node. Do not move live subtrees between updates.

---

## Documentation

Full documentation is available at [https://nuclo.dev/](https://nuclo.dev/)

- [Getting Started](https://nuclo.dev/getting-started)
- [API Reference](https://nuclo.dev/core-api)
- [Examples](https://nuclo.dev/examples)

---

## Author

Created by **Danilo Celestino de Castro**

- GitHub: [@dan2dev](https://github.com/dan2dev)
- Twitter: [@dan2dev](https://twitter.com/dan2dev)

---

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.

This library is free and open source. When you use Nuclo, include attribution in your documentation or application.

**In short:** Use Nuclo freely, and give credit to its source.
