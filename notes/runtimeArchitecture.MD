# Runtime Architecture & Memory Management

## Overview

Nuclo uses several runtime systems to manage reactive DOM updates. Each system tracks DOM nodes and re-evaluates/re-renders them when application state changes. To prevent memory leaks, all systems that hold global references to DOM elements MUST use **WeakRef** to allow garbage collection when elements are removed from the DOM.

## Core Principle: WeakRef Pattern

All runtime systems follow this pattern:

```typescript
// ✅ CORRECT: Use WeakRef to allow GC
const runtimeRegistry = new Map<WeakRef<Node>, RuntimeInfo>();

// ❌ WRONG: Strong references prevent GC
const runtimeRegistry = new Set<Runtime>(); // Runtime contains Node references
```

## Runtime Systems

### 1. List Runtime (`src/list/runtime.ts`)

**Purpose**: Manages dynamic lists of elements that re-render when data changes.

**Global Registry**: `Map<WeakRef<Comment>, ListRuntimeInfo>`

**DOM References**:
- `startMarker`: Comment node marking list start
- `endMarker`: Comment node marking list end  
- `host`: Parent element containing the list
- `records`: Array of rendered item elements

**Key Operations**:
- `createListRuntime()`: Creates markers, initializes registry entry
- `sync()`: Diffs items array, reuses/creates/removes DOM elements
- `updateListRuntimes()`: Updates all registered lists, cleans up disconnected nodes

**Memory Safety**:
- Uses WeakRef keyed by startMarker (Comment node)
- Checks `ref.deref() === undefined` for GC cleanup
- Checks `isNodeConnected()` for disconnection cleanup
- Removes dead WeakRefs from Map

**Update Trigger**: Called by `update()` function in updateController

---

### 2. When Runtime (`src/when/runtime.ts`)

**Purpose**: Conditional rendering - shows/hides content based on boolean conditions.

**Global Registry**: `Map<WeakRef<Comment>, WhenRuntimeInfo>`

**DOM References**:
- `startMarker`: Comment node marking conditional block start
- `endMarker`: Comment node marking conditional block end
- `host`: Parent element containing the conditional
- `groups`: Array of condition/content pairs
- `activeIndex`: Tracks which branch is rendered

**Key Operations**:
- `registerWhenRuntime()`: Adds runtime to global registry
- `evaluateActiveCondition()`: Determines which branch should render
- `renderWhenContent()`: Clears old content, renders active branch
- `updateWhenRuntimes()`: Re-evaluates all conditions, cleans up disconnected nodes

**Memory Safety**:
- Uses WeakRef keyed by startMarker (Comment node)
- Checks `ref.deref() === undefined` for GC cleanup
- Checks `isNodeConnected()` for disconnection cleanup
- Removes dead WeakRefs from Map

**Update Trigger**: Called by `update()` function in updateController

---

### 3. Reactive Text Nodes (`src/core/reactiveText.ts`)

**Purpose**: Text nodes that automatically update when their resolver function returns a new value.

**Global Registry**: `Map<WeakRef<Text>, ReactiveTextNodeInfo>`

**DOM References**:
- Text nodes (created by `createReactiveTextNode()`)

**Key Operations**:
- `createReactiveTextNode()`: Creates text node, registers WeakRef
- `notifyReactiveTextNodes()`: Re-evaluates all resolvers, updates text content

**Memory Safety**: ✅ **Already using WeakRef**
- WeakRef keyed by Text node
- Comprehensive cleanup in `notifyReactiveTextNodes()`
- Checks `ref.deref() === undefined` and `isNodeConnected()`

**Update Trigger**: Called by `update()` function in updateController

---

### 4. Reactive Attributes (`src/core/reactiveAttributes.ts`)

**Purpose**: Element attributes that reactively update based on resolver functions.

**Global Registry**: `Map<WeakRef<Element>, ReactiveElementInfo>`

**DOM References**:
- Elements with reactive attributes
- Each element stores `Map<string, AttributeResolverRecord>` for its attributes

**Key Operations**:
- `registerAttributeResolver()`: Adds attribute resolver to element
- `notifyReactiveElements()`: Re-evaluates all attribute resolvers
- `handleUpdateEvent()`: Responds to `dispatchEvent(new Event('update'))`

**Memory Safety**: ✅ **Already using WeakRef**
- WeakRef keyed by Element
- Comprehensive cleanup in `notifyReactiveElements()`
- Also cleans up in event handler when elements are disconnected

**Update Trigger**: Called by `update()` function in updateController + DOM events

---

### 5. Conditional Elements (`src/utility/conditionalInfo.ts`)

**Purpose**: Tracks elements with conditional rendering logic for updates.

**Global Registry**: `Set<WeakRef<Node>>`

**DOM References**:
- Nodes (Elements or Comments) with conditional rendering
- Additional metadata stored as `__conditionalInfo` property on nodes

**Key Operations**:
- `registerConditionalNode()`: Adds node to global registry
- `updateConditionalElements()`: Updates all registered conditionals
- `clearConditionalInfo()`: Manual cleanup of node metadata

**Memory Safety**: ✅ **Already using WeakRef**
- WeakRef in Set
- Checks `ref.deref() === undefined` and `isNodeConnected()`

**Update Trigger**: Called by `update()` function in updateController

---

### 6. Scope Roots (`src/utility/scope.ts`)

**Purpose**: Tracks root elements for scoped updates (update only part of DOM tree).

**Global Registry**: `Map<string, Set<WeakRef<Element>>>`

**DOM References**:
- Elements marked as scope roots (via scope IDs)

**Key Operations**:
- `registerScopeRoot()`: Adds element to scope ID set
- `getScopeRoots()`: Retrieves all roots for given scope IDs
- Automatic cleanup of GC'd and disconnected elements

**Memory Safety**: ✅ **Already using WeakRef**
- WeakRef in Sets, indexed by scope ID
- Comprehensive cleanup when retrieving roots

**Update Trigger**: Used by `update(...scopeIds)` to filter which nodes update

---

## Update Controller Flow

The `updateController.ts` orchestrates all runtime systems:

```typescript
export function update(...scopeIds: string[]): void {
  let scope: UpdateScope | undefined;
  
  // Build scope filter if scope IDs provided
  if (scopeIds.length > 0) {
    const roots = getScopeRoots(scopeIds);
    scope = {
      roots,
      contains: (node) => roots.some(root => root.contains(node))
    };
  }

  // Update all systems in order
  for (const fn of updaters) fn(scope);
}

const updaters: ReadonlyArray<(scope?: UpdateScope) => void> = [
  updateListRuntimes,       // 1. List runtime
  updateWhenRuntimes,       // 2. When runtime
  updateConditionalElements,// 3. Conditional elements
  notifyReactiveElements,   // 4. Reactive attributes
  notifyReactiveTextNodes,  // 5. Reactive text
  dispatchGlobalUpdateEvent,// 6. Custom update events
] as const;
```

---

## Memory Leak Prevention Checklist

When creating a new runtime system, ensure:

### 1. Use WeakRef for DOM References
```typescript
// ✅ DO: Store WeakRef
const registry = new Map<WeakRef<Node>, RuntimeInfo>();

// ❌ DON'T: Store direct references
const registry = new Set<Runtime>(); // Runtime has node properties
```

### 2. Check for Garbage Collection
```typescript
const node = ref.deref();
if (node === undefined) {
  // Node was garbage collected
  registry.delete(ref);
  continue;
}
```

### 3. Check for DOM Disconnection
```typescript
if (!isNodeConnected(node)) {
  registry.delete(ref);
  continue;
}
```

### 4. Support Scoped Updates
```typescript
export function updateMyRuntime(scope?: UpdateScope): void {
  for (const [ref, info] of registry) {
    const node = ref.deref();
    if (node === undefined || !isNodeConnected(node)) {
      registry.delete(ref);
      continue;
    }
    
    // Skip if outside update scope
    if (scope && !scope.contains(node)) continue;
    
    // ... perform update
  }
}
```

### 5. Clean Up in Update Cycles
```typescript
const toDelete: WeakRef<Node>[] = [];

for (const [ref, info] of registry) {
  const node = ref.deref();
  if (node === undefined || !isNodeConnected(node)) {
    toDelete.push(ref);
    continue;
  }
  // ... update logic
}

// Batch deletions
for (const ref of toDelete) {
  registry.delete(ref);
}
```

---

## Common Pitfalls

### 1. Storing Runtimes with DOM Properties
```typescript
// ❌ BAD: Runtime object contains direct DOM references
interface BadRuntime {
  element: Element;  // Strong reference!
  update(): void;
}
const runtimes = new Set<BadRuntime>(); // Prevents GC

// ✅ GOOD: Separate runtime data from DOM references
interface RuntimeInfo {
  update(): void;
}
const runtimes = new Map<WeakRef<Element>, RuntimeInfo>();
```

### 2. Forgetting isConnected Checks
```typescript
// ❌ BAD: Only checks if node exists
if (node) {
  update(node);
}

// ✅ GOOD: Also checks if node is in document
if (node && isNodeConnected(node)) {
  update(node);
}
```

### 3. Not Cleaning Up WeakRefs
```typescript
// ❌ BAD: Leaves dead WeakRefs in Map
for (const [ref, info] of registry) {
  const node = ref.deref();
  if (!node) continue; // WeakRef left in Map!
}

// ✅ GOOD: Removes dead WeakRefs
const toDelete: WeakRef<Node>[] = [];
for (const [ref, info] of registry) {
  const node = ref.deref();
  if (!node) {
    toDelete.push(ref);
    continue;
  }
}
for (const ref of toDelete) {
  registry.delete(ref);
}
```

### 4. Using Comment Nodes as Keys
Comment nodes (markers) are ideal WeakRef keys because:
- They're persistent (not replaced during updates)
- They mark specific positions in the DOM
- When removed, the entire runtime should be cleaned up
- They're lightweight (no child nodes)

```typescript
// ✅ GOOD: Use marker as key
const { start, end } = createMarkerPair("list");
const info = { /* runtime data */ };
registry.set(new WeakRef(start), info);

// When start marker is removed from DOM and GC'd,
// the WeakRef allows the entire entry to be cleaned up
```

---

## Testing Memory Leaks

To verify no memory leaks:

1. **Create elements**: Render components with runtimes
2. **Remove from DOM**: `element.remove()`
3. **Trigger GC**: 
   - Chrome: DevTools → Memory → Collect garbage
   - Programmatic: `if (global.gc) global.gc()`
4. **Trigger update**: Call `update()` to run cleanup
5. **Verify cleanup**: Check registries are empty/pruned

```typescript
// Example test
test('list runtime cleans up removed elements', () => {
  const list = createListRuntime(...);
  list.host.remove(); // Remove from DOM
  
  if (global.gc) global.gc(); // Trigger GC (requires --expose-gc flag)
  update(); // Trigger cleanup cycle
  
  // Verify runtime was cleaned up
  // (actual verification depends on exposing registry for testing)
});
```

---

## Performance Considerations

### WeakRef Overhead
- `deref()` calls are fast (nanoseconds)
- Cleanup loops are O(n) where n = registered runtimes
- Only runs during `update()` calls, not on every render

### When to Optimize
- Most apps have <1000 reactive nodes - overhead is negligible
- For >10,000 reactive nodes, consider:
  - Batching updates (already done via `update()`)
  - Scoped updates (update only affected subtrees)
  - Debouncing update calls from rapid state changes

### Memory vs Speed Tradeoff
Using WeakRef trades tiny CPU overhead for memory safety:
- **Without WeakRef**: 0ms cleanup, infinite memory leak
- **With WeakRef**: ~0.1ms cleanup per 1000 nodes, no memory leak

The tradeoff is always worth it for long-running applications.

---

## Future Patterns

All new runtime systems should:
1. Use `Map<WeakRef<Node>, RuntimeInfo>` pattern
2. Implement `updateXRuntimes(scope?: UpdateScope): void`
3. Add to `updaters` array in `updateController.ts`
4. Follow cleanup checklist above
5. Document in this file

---

## References

- [MDN: WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- [MDN: FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
- [TC39 WeakRefs Proposal](https://github.com/tc39/proposal-weakrefs)
- Internal: `notes/memoryLeak.MD` - General memory leak patterns
- Internal: `notes/closures.MD` - Closure-related memory issues
