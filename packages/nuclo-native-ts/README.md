# @nuclo/native-ts (POC)

Write a nuclo app in TypeScript. `nuclo-native-ts build` compiles it ahead of time to **Swift (UIKit)** and **Kotlin (Android Views)**. The app ships no JavaScript engine and no JS bundle.

It is the counterpart of `nuclo-native`. That package runs your bundle in a JS engine and drives native widgets from it; this one translates the bundle away. The syntax is nuclo's and the model is nuclo's: plain mutable state, builders that take a value or a `() => value`, and an explicit `update()`.

```ts
import { button, div, p, render, update } from "@nuclo/native-ts";

let count = 0;

const App = () =>
  div(
    { style: { padding: 24, gap: 16 } },
    p(() => `Count: ${count}`),
    button("Increment", { onClick: () => { count++; update(); } }),
  );

render(App);
```

compiles to

```swift
@MainActor var count: Int = 0

@MainActor @discardableResult func App() -> Node {
    return div(
        A.style(Style(gap: 16.0, padding: 24.0)),
        p(A.text { "Count: \(count)" }),
        button(
            A.text("Increment"),
            A.onClick { _ in
                count += 1
                update()
            }
        )
    )
}
```

```kotlin
var count: Int = 0

fun App(): Node {
    return div(
        A.style(Style(gap = 16.0, padding = 24.0)),
        p(A.text { "Count: ${count}" }),
        button(
            A.text("Increment"),
            A.onClick { _ ->
                count += 1
                update()
            },
        ),
    )
}
```

`count` became `Int` because every write to it is a whole number.

## Build

```bash
bun x tsx src/compiler/cli.ts build examples/full-showcase/App.ts --out examples/full-showcase/build
```

This writes `build/ios/{App.swift,NucloRuntime.swift}` and `build/android/{App.kt,NucloRuntime.kt}`. Each folder holds the complete sources of a native app. Type errors and unsupported constructs stop the build with `file:line:column`, and nothing is written:

```
Bad.ts:3:11 - error: `any` cannot be compiled to a native type; give the value a real type.
Bad.ts:5:1 - error: `eval` cannot be compiled ahead of time.
Bad.ts:6:1 - error: Classes are not supported; use interfaces and functions.
Bad.ts:7:7 - error: The type { a: number; } has no native equivalent; declare it as an interface.
```

### Android

`hosts/android` is a Gradle project (AGP 9, no NDK, no dependencies) that compiles the generated folder:

```bash
cd hosts/android && JAVA_HOME=~/.jdks/jdk-17.0.20+8 ANDROID_HOME=~/Android/Sdk ./gradlew assembleDebug --offline
```

Point `nucloSources` in `gradle.properties` at another build folder to build another app.

### iOS

1. Create an iOS App project in Xcode (UIKit, iOS 15+).
2. Delete its `AppDelegate`, `SceneDelegate` and storyboard. Remove `UIApplicationSceneManifest` and `UIMainStoryboardFile` from `Info.plist`.
3. Add both files from `build/ios`.

`App.swift` declares the `@main` app delegate.

## How it works

```
App.ts ──ts.createProgram + TypeChecker──▶ transpile.ts ──typed IR (ir.ts)──┬─▶ emitSwift.ts  ─▶ App.swift + NucloRuntime.swift
                                                                            └─▶ emitKotlin.ts ─▶ App.kt    + NucloRuntime.kt
```

- **`transpile.ts`** settles every TypeScript question, so the printers only choose syntax:
  - Types: `string`, `boolean`, `T | null` → optional, `T[]` → `[T]` / `MutableList<T>`, `Record<string, T>` → a map, interfaces → classes.
  - Numbers: each variable, property, parameter and return value holding a `number` starts as `Int`. A fixpoint over every write turns it into `Double` once something non-whole can reach it (`/`, a decimal literal, a `Double` slot). `Int` / `Double` annotations from the API force the choice.
  - Narrowing: a nullable value that TypeScript has narrowed is force-unwrapped where it is read (`todo!.title` / `todo!!.title`).
  - Async: `async` functions become `async throws` / `suspend`. An un-awaited call is launched (`Task {}` / `launch {}`).
  - Builders: attribute objects expand into modifiers. `when()` / `into()` content becomes closures, so a branch is built when it opens. Style literals become typed `Style` values with enums. `variants()` becomes a recipe. `createRouter()` becomes the native router. `res.json<T>()` gets a generated decoder, with no reflection.
- **The runtimes** (`src/runtimes/*`) implement the API on one model:
  - A `Node` tree whose dynamic values are bindings, each dirty-checked against its last value before a view is touched.
  - Fragment nodes for `list` / `when` / `region` / `into`, which own no view and reconcile in place.
  - One flex layout algorithm (`Flex`), written once per platform, so both lay out the same boxes.

| nuclo | iOS | Android |
| --- | --- | --- |
| `update()` / `update("id")` + `scope("id")` | re-runs bindings of all roots / of the scope's subtrees | same |
| `p(() => …)`, `{ style: () => … }`, `value`, `checked`, `disabled` | binding + `Equatable` dirty check → `UILabel.text`, layer paint… | binding + `==` → `TextView.text`, drawable… |
| `list(items, render)` | rows keyed by identity (`===`), views inserted/moved/removed in their `FlexView` | same, in `FlexLayout` |
| `when().when().else()` | branch built on open, destroyed on close | same |
| `region()` / `into()` (`latest`, `stack`, `empty`) | content lives as long as the `into()` | same |
| `onMount` / `onDestroy` (+ returned cleanup) | `didMoveToWindow` of a probe subview / node destroy | `OnAttachStateChangeListener` / node destroy |
| `async` + `fetch` + `when()` branches | `URLSession`, resumes on the main actor | `HttpURLConnection` on a thread, stdlib coroutine resumed on the main looper |
| `css()`, `cx()`, `variants()` | `Style` merges, cached per selection | same |
| `createRouter(routes, { tabs })`, `go` / `back` / `reset` | `UITabBarController` + `UINavigationController`, edge swipe syncs the router | bottom bar, app bar, view stack, system back (predictive-back dispatcher on API 33+) |
| `render(App)`, then `render(Overlay)` | main view, then a pass-through layer over it | same |

## What was checked

On this machine (Linux):

- **Kotlin**: `App.kt` and `NucloRuntime.kt` compile against Android SDK 37 with AGP 9.5 and Kotlin 2.4, with 0 errors and 0 warnings. The showcase was driven on the Android emulator (API 37):
  - counter, `disabled`, and an `Even` / `Odd` `when()`;
  - `update('cart')` refreshing only its scope (4 inside it, 2 outside, until a global update);
  - the clock's interval starting in `onMount` and its cleanup and `onDestroy` running when its branch closes;
  - adding a todo with Enter, toggling, filtering, the `into('modal')` dialog over the navigation, deleting, toasts;
  - pushing `/todos/:id` and `/feed/:id` (title from params), back by key and by arrow;
  - the feed's loading branch (progress on a scoped update), the decoded posts, and the HTTP 404 error branch.
- **Swift**: **not compiled**. There is no Swift toolchain here, and UIKit only builds on macOS. The runtime and emitter were written for Swift 5.9+ / iOS 15 with `@MainActor` throughout. Expect a first build in Xcode to surface a few fixes.
- **TypeScript**: `bun run typecheck` checks the compiler and the example.

## Differences from nuclo, on purpose

- **Imports, not globals.** Apps import from `@nuclo/native-ts`. The lib is ES2022 only, with no DOM and no Node, so anything the compiler can't translate fails to type-check or is reported.
- **Interfaces become `final class` (Swift) and `class` (Kotlin), not `struct` or `data class`.** JavaScript objects are references: `todo.done = …` in a list row has to change the todo the list holds. A Swift struct would copy it, and a data class's structural `equals` would break `list()`'s identity keys and `indexOf`.
- **Arrays are Swift `[T]`, which is a value type.** Mutating an array through a second variable that aliases it won't reach the original as it does in JavaScript. Globals and properties, which is how nuclo state is written, behave the same.
- **Styles** are a typed subset of CSS laid out as flexbox (column by default), in pt / dp. The subset is the `Style` interface in `src/index.ts`. There are no selectors, pseudo-classes, `@media` or theme tokens (`createCss`).
- **Swift dictionaries are unordered**, so on iOS `variants()` applies groups in name order (Kotlin keeps declaration order). It only matters when two groups set the same property.
- **`when(cond, …)` with a non-function condition** is fixed when built, as in nuclo.

## Not supported (reported by the compiler)

`any`, `eval`, classes, enums, namespaces, `this`, `delete`, destructuring, generators, spreads outside style objects, `finally`, `async` callbacks (call an async function instead), `++` inside expressions, and callbacks with an index on `map` / `filter` / `forEach` and similar. Also unsupported: DOM/Node APIs, SVG, SSR/hydration, `forceUpdate`, `windowed()`, video, and `nuclo-router`'s URL, loader and layer features (the router here is nuclo-native's stack router).
