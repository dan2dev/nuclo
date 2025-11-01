# nuclo

**A simple, explicit DOM library for building reactive user interfaces.**

Build reactive UIs without the magic. Just functions, plain JavaScript objects, and explicit `update()` calls. No virtual DOM, no complex state management, no build configuration required.

```ts
import 'nuclo';

let count = 0;

const counter = div(
  h1(() => `Count: ${count}`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);
```

## Why nuclo?

- **Explicit and Predictable** – You control when updates happen with a simple `update()` call
- **Direct DOM Manipulation** – Work directly with the DOM, no virtual layer in between
- **Tiny Footprint** – Minimal bundle size, maximum performance
- **Global Tag Builders** – Natural API with global functions for all HTML and SVG elements
- **TypeScript-First** – Full type definitions for all 140+ HTML and SVG tags
- **Fine-Grained Reactivity** – Only updates what changed, nothing more

---

## Installation

```bash
npm install nuclo
```

### Usage

Simply import once to register all global functions:

```ts
import 'nuclo';

// Now use div(), update(), on(), list(), when(), render(), etc. globally
let count = 0;
const app = div(
  h1(() => `Count: ${count}`),
  button('Click', on('click', () => { count++; update(); }))
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
  button('Increment', on('click', () => { count++; update(); })),
  button('Reset', on('click', () => { count = 0; update(); }))
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
    button('Add', on('click', addTodo))
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
        button('×', on('click', () => {
          todos = todos.filter(t => t.id !== todo.id);
          update();
        }))
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

const state: State = { status: 'idle', products: [] };
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
    button('Search', on('click', fetchProducts))
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

### 1. **Explicit Updates**

nuclo doesn't auto-detect changes. You call `update()` when ready:

```ts
let name = 'World';

// Mutate freely
name = 'Alice';
name = name.toUpperCase();

// Update once when ready
update();
```

**Advantages of explicit `update()`:**

- **Performance**: Batch multiple mutations into a single update cycle
- **Control**: You decide exactly when the UI should refresh
- **Predictability**: Zero surprise re-renders, explicit update flow
- **Simplicity**: No proxies, no dependency graphs, just objects and functions
- **Debugging**: Set a breakpoint at `update()` to trace all state changes

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

### 2. **Reactive Functions**

Zero-arg functions become reactive:

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

DOM is preserved if the active branch doesn't change.

### 4. **List Synchronization**

Lists use object identity (not keys) to track items:

```ts
list(() => items, (item, index) =>
  div(() => `${index}: ${item.name}`)
)
```

Mutate the array (push, splice, reverse), then call `update()`. Elements are reused if the item reference is the same.

## API Reference

### Core Functions

#### `update()`

Triggers all reactive updates. Call this after mutating state:

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

Items are tracked by object identity. Mutate the array and call `update()` to sync.

#### `when(condition, ...content)`

Conditional rendering with chaining:

```ts
when(() => count > 10,
  div('High')
).when(() => count > 0,
  div('Low')
).else(
  div('Zero')
)
```

First matching condition wins. DOM is preserved if the active branch doesn't change.

#### `on(event, handler, options?)`

Attach event listeners:

```ts
button('Click me',
  on('click', () => console.log('clicked')),
  on('mouseenter', handleHover, { passive: true })
)
```

### Tag Builders

All HTML and SVG tags are available globally:

```ts
div(), span(), button(), input(), h1(), p(), ul(), li()
svg(), circle(), path(), rect(), g()
// ... and 140+ more
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

Reactive attributes use functions:

```ts
div({
  className: () => isActive ? 'active' : '',
  disabled: () => !isValid,
  style: () => ({ opacity: isVisible ? 1 : 0 })
})
```

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

Even if not initially needed:

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

- **No virtual DOM diffing** – Direct DOM manipulation for maximum efficiency
- **Fine-grained updates** – Only updates what changed, nothing more
- **Element reuse** – Lists intelligently reuse DOM elements when items move
- **Branch preservation** – Conditional branches persist until conditions change

For high-frequency updates (animations, game loops), batch mutations before calling `update()`.

---

## Debugging

### Inspect Markers

Open DevTools to see comment markers that help you understand the structure:

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
- Ensure you're calling `update()` after state changes
- Verify your reactive functions are returning the expected values

**List items not reusing elements?**
- Keep object references stable (mutate instead of replacing)
- Avoid creating new objects when updating properties

---

## Roadmap

- Keyed list variant for explicit key-based tracking
- Transition and animation helpers
- Dev mode diagnostics and warnings
- Server-side rendering (SSR) support

---

## Documentation

Full documentation is available at [https://dan2dev.github.io/nuclo/](https://dan2dev.github.io/nuclo/)

- [Getting Started](https://dan2dev.github.io/nuclo/getting-started.html)
- [API Reference](https://dan2dev.github.io/nuclo/api.html)
- [Examples](https://dan2dev.github.io/nuclo/examples.html)

---

## Author

Created by **Danilo Celestino de Castro**

- GitHub: [@dan2dev](https://github.com/dan2dev)
- Twitter: [@dan2dev](https://twitter.com/dan2dev)

---

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

This library is free and open source. When using nuclo, please include attribution in your documentation or application.

**TL;DR:** Use it freely, give credit where it's due!
