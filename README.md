# nuclo

**A DOM library for people who peaked in the jQuery era and never looked back.**

_Yes, this is yet another JavaScript library. We're aware. The ecosystem now has more libraries than actual developers. We're sorry. Or you're welcome? We're still figuring it out._

Build reactive UIs without the magic tricks. Just functions, mutations, and a single `update()` call when you feel like it.

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

render(counter);
```

## Why nuclo?

- **Zero magic** – Like a microwave with just one button. You press `update()`, stuff happens.
- **No virtual DOM** – Why simulate the DOM when you can just... use the DOM? *taps forehead*
- **Tiny footprint** – Smaller than your average React component's prop types
- **Global API** – `div()` is everywhere, like that one friend who shows up uninvited but makes everything fun
- **TypeScript-first** – All 140+ tags typed. Yes, even `<bdi>`. You're welcome.
- **Real reactivity** – Updates only what changed. Your browser's repaint budget will thank you.

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
render(app);
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

render(app);
```

### Todo List

```ts
import 'nuclo';

type Todo = { id: number; text: string; done: boolean };

let todos: Todo[] = [];
let nextId = 1;
let input = '';

function addTodo() {
  if (!input.trim()) return;
  todos.push({ id: nextId++, text: input, done: false });
  input = '';
  update();
}

const app = div(
  { className: 'todo-app' },

  // Input
  div(
    input({ value: () => input },
      on('input', e => { input = e.target.value; update(); }),
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

render(app);
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

render(app);
```

### Loading States & Async

```ts
import 'nuclo';

type State = { status: 'idle' | 'loading' | 'error'; data: any[]; error?: string };

let state: State = { status: 'idle', data: [] };

async function fetchData() {
  state.status = 'loading';
  update();

  try {
    const response = await fetch('/api/data');
    state.data = await response.json();
    state.status = 'idle';
  } catch (err) {
    state.status = 'error';
    state.error = err.message;
  }
  update();
}

const app = div(
  button('Load Data', on('click', fetchData)),

  when(() => state.status === 'loading',
    div('Loading...')
  ).when(() => state.status === 'error',
    div({ className: 'error' }, () => `Error: ${state.error}`)
  ).when(() => state.data.length > 0,
    list(() => state.data, item => div(item.name))
  ).else(
    div('No data loaded')
  )
);

render(app);
```

---

## Core Concepts

### 1. **Explicit Updates**

Unlike React or Vue, nuclo doesn't auto-detect changes. You call `update()` when ready:

```ts
let name = 'World';

// Mutate freely
name = 'Alice';
name = name.toUpperCase();

// Update once when ready
update();
```

**Advantages of explicit `update()`:**

- **Performance**: Batch mutations like a responsible adult. One `update()` > ten thousand proxy getters watching your every variable assignment like helicopter parents.
- **Control**: You're the boss of when pixels change. Perfect for animations, async chaos, or coordinating changes without asking a framework permission.
- **Predictability**: Zero surprise re-renders. No "why did this component update 47 times?!" sessions in DevTools.
- **Simplicity**: No proxies, no dependency graphs, no PhD required. Just objects and a function named `update()`. Revolutionary, we know.
- **Debugging**: Put a breakpoint at `update()`. That's it. That's the whole debugging strategy.

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

Mutate like you're stress-testing the array, then update once like you meant to do that:

```ts
// Galaxy brain
items.push(item1);
items.push(item2);
items.sort();
update();

// Smooth brain (but hey, it works)
items.push(item1);
update();
items.push(item2);
update();
```

### Object Identity for Lists

Lists track items by reference. Mutate the object, not your soul:

```ts
// The way
todos[0].done = true;
update();

// The dark side (RIP that DOM element, we hardly knew ye)
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

- **No virtual DOM diffing** – We skip the middle-manager and talk directly to the DOM
- **Fine-grained updates** – Only updates what changed. Like a surgeon, not a bulldozer.
- **Element reuse** – Lists are smart enough to move elements instead of yeeting them into the void
- **Branch preservation** – `when` branches stay alive unless conditions change. Low-key immortal.

For high-frequency updates (animations, game loops, existential crises), batch mutations before calling `update()`.

---

## Debugging

### Inspect Markers

Open DevTools, stare at the DOM like it owes you money:

```html
<!-- when-start-1 -->
<div>Content</div>
<!-- when-end -->

<!-- list-start-2 -->
<div>Item 1</div>
<div>Item 2</div>
<!-- list-end -->
```

These comment markers are your breadcrumbs. Follow them to victory.

### Common Issues

**Content not updating?**
- Did you call `update()`? (Asking because 80% of the time, you didn't)
- Are your conditions/functions returning what you think they are? `console.log()` is your friend.

**List items not reusing elements?**
- Stop spreading objects like it's 2018. Mutate them.
- Item references need to be stable, not having an identity crisis on every render.

---

## Roadmap

- Keyed list variant (for when object identity isn't your thing)
- Transition/animation helpers (make things swoosh)
- Dev mode diagnostics (we'll yell at you when you forget `update()`)
- SSR support (because apparently servers need to render HTML now)

---

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

This library is free and open source. When using nuclo, please include attribution in your documentation, application, or source code. See the [LICENSE.md](LICENSE.md) file for attribution examples.

**TL;DR:** Use it freely, just give credit. It helps others discover this library!
