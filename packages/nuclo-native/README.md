# nuclo-native (POC)

Write a normal nuclo app. It renders with real native widgets — no webview — on Android, iOS, macOS, Windows and Linux, and builds as a web app (SPA and installable PWA) from the same source. The same bundle also runs on a GPUI host that draws every platform itself.

Navigation is each platform's own: `UINavigationController` and a tab bar on iOS, a sidebar and toolbar on macOS, Material motion and predictive back on Android, libadwaita on Linux, a Fluent nav pane on Windows.

```ts
import "nuclo-native";

let count = 0;

const App = () =>
  div(
    { style: { padding: 24, gap: 16 } },
    h1(() => `Count: ${count}`),
    button("Increment", { onClick: () => { count++; update(); } }),
  );

render(App, document.body);
```

The showcase (`examples/showcase`) on Linux, GTK 4:

![Linux](docs/linux.png)

The same bundle on Android, platform Views:

![Android](docs/android.png)

## Examples

Each folder in `examples/` is an app; `examples/ui.ts` is the small design system they share. Run any of them on any target: `bun run ios todo`, `bun run android battery`, `bun run web` (the showcase when no example is named).

- **`showcase`**: a three-tab app built only from nuclo calls and inline styles.
  - **Dashboard** (`/`): stat cards, a bar chart that resizes when you switch Week / Month / Year and highlights the bar you tap, and horizontal share bars. Charts are plain views with a `height` or `width`, so they need no canvas.
  - **Gallery** (`/gallery`, `/gallery/:id`): an image grid that pushes a detail screen with a route parameter and a like toggle.
  - **Account** (`/account`): text, email and password fields, a segmented choice, checkboxes, validation messages and a success state.
- **`todo`**: a todo list. Add a task (Enter or Add), check it off, filter All / Active / Done, clear the finished ones. A task opens on its own screen, pushed on the native stack, to edit its title and notes or delete it.
- **`battery`**: a battery monitor. A gauge drawn with views, the level, the status and the time to full or empty, live from the platform (see [Device data](#device-data)); a chart of the readings and a pushed screen listing them. A device without a battery says so.
- **`people`**: a social network's directory with infinite scroll. Twenty people at a time, the next twenty as you scroll near the end (`onEndReached`, see [Navigation](#navigation)), a Follow toggle on each, and a footer once all 50,000 are in. Only rows near the screen stay on the host ([Long lists](#long-lists)); `bun test/people.bench.ts` times page loads, taps and scrolling as the list grows.
- **`chirp`**: a small social app on four bottom tabs (Home, Explore, Alerts, Profile) with the native back stack. The home feed pages in 20 posts at a time until all 5,000 are in. Posts carry text, one or two photos, or a 6-second video. In lists a video is its poster with a play badge; an opened post and the full-screen viewer play it in the platform's own player ([Video](#video)). A post opens its thread, its likers and that viewer. A profile shows its friends, and each friend's profile shows theirs, so you can keep pushing screens through the friend graph. Likes, reposts and friend requests rebuild only the rows that show them, on every screen at once.
- **`docs`**: the nuclo docs site (`nuclo/docs`) as an app, in the site's design, on three tabs. **Home**: the site's hero, a live counter, the update() cycle, philosophy, features, comparison, benchmark and quick start. **Docs**: all 42 sections by group with a filter; each opens on its own screen with its code highlighted in the site's colours and its live demo inline, and from a desktop width the site's sidebar beside it. **Examples**: all 75 examples by group; each opens with its source (a tab per file) and, for the 27 that only need views (basics, components, API, styling, forms), a live preview on native widgets beside it. The SVG, routing and app examples run in the browser, so they show their source. Layouts follow the site's breakpoints (700 and 1024 px). The text is the site's own English text: `bun --tsconfig-override ../../docs/tsconfig.bun.json examples/docs/extract.ts` regenerates `content.json` from it. Inline formatting (links, inline code) shows as plain text.
- **`basics`**: the smallest one, a counter and an inline todo list without navigation.

## Navigation

`nuclo-native/router` is a stack router whose screens, stacks and tabs the host shows with the platform's own navigation:

```ts
import { createRouter } from "nuclo-native/router";

export const router = createRouter(
  {
    "/": { view: Dashboard, title: "Pulse" },
    "/gallery": { view: Gallery, title: "Gallery" },
    "/gallery/:id": { view: PhotoDetail, title: ({ id }) => photoTitle(id) }, // receives { id }
  },
  {
    tabs: [
      { path: "/", title: "Dashboard", icon: "chart" },
      { path: "/gallery", title: "Gallery", icon: "photo" },
    ],
  },
);

render(router.outlet, document.body); // the app's navigation is its root

router.go("/gallery/dunes"); // push onto the current tab's stack
router.back();               // pop
router.reset("/");           // select the tab that owns "/" and pop it to its root
```

A route is a view, or `{ view, title, onEndReached }` where the title is the navigation bar's. `onEndReached` runs when the screen is scrolled to within half its height of its end, once per content height, so it is where an infinite list loads its next page; until that page grows the content it does not fire again, which also covers a page that arrives later. Each tab keeps its own stack. Icons are semantic names (`chart`, `photo`, `person`) each host maps to its icon set.

| Target | Tabs | Push / pop | Back |
| --- | --- | --- | --- |
| iOS | `UITabBarController` | `UINavigationController`, large titles on root screens | back button, interactive edge swipe, re-tap the tab |
| macOS | source-list sidebar (`NSSplitViewController`) | slide (`NSViewController` transition), the window title is the screen's | toolbar chevron, ⌘[, two-finger swipe |
| Android | Material 3 bottom bar, fade through | Material shared axis X | toolbar arrow, back key, predictive back gesture (API 34+), re-tap the tab |
| Linux | `Adw.ViewStack` + `Adw.ViewSwitcherBar` | `Adw.NavigationView` | header bar back, swipe, Alt+←, mouse back |
| Windows | Fluent nav pane | drill-in | back button, Alt+←, mouse back |
| Web | bottom tab bar | directional view transitions | bar back button, browser back (its own swipe-back animation is kept) |

A screen scrolls without a scrollbar. A tap on its bar, or on its own tab while at the tab's root, scrolls it back to the top (macOS: the sidebar row only).

JS owns the state; the host owns the UI. When the user goes back natively, the host pops first and reports `pop` with the depth left; the router follows. On the web the route lives in the URL hash (`#/gallery/dunes`) and the browser history is the stack, so links, reloads and the back button work on any static host; switching tabs there resets the tab.

`nuclo-router` itself needs `URL`, `history` and `location`, which the bare JS engines do not have.

## Device data

Some data only the platform has. `nuclo-native/device` reads it from the host and calls back when it changes:

```ts
import { battery } from "nuclo-native/device";

const now = battery((next) => { /* every later reading */ update(); });
// { level: 0.56, state: "discharging", minutes: 285 }, or null without a battery
```

`level` runs 0..1, `state` is `charging`, `discharging`, `full` or `unknown` (on power but not charging), and `minutes` is the time to full or to empty when the platform knows it.

The host side is two calls next to the ops: the host exposes `__nuclo_device(name) → json` (or `""`), and calls `__nuclo_device_changed(name, json)` when the value changes.

| Target | Battery from | Checked |
| --- | --- | --- |
| iOS | `UIDevice` battery monitoring | The simulator has no battery: shows "No battery" |
| macOS | IOKit power sources, notified on change | This Mac: matches `pmset` (level, status, time left) |
| Android | `ACTION_BATTERY_CHANGED`, `computeChargeTimeRemaining()` | Emulator, driven with `adb emu power`: discharging, charging, full, live |
| Linux | UPower's display device over D-Bus | A fake UPower proxy (no UPower on macOS) |
| Windows | `GetSystemPowerStatus`, polled every 10 s | Compiles |
| Web | the Battery Status API (Chromium); elsewhere null | The browser pane: this Mac's battery |
| GPUI | `starship-battery` on desktop, `gpui-mobile` on iOS and Android; polled every 5 s | This Mac (unit test), the iOS simulator ("No battery") |

## Long lists

A screen keeps on the host only what is near its visible part, so a list can grow to tens of thousands of rows. Hosts report each screen's scroll position (`scroll`); in a column of content height several screens tall (a list), JS parks the rows more than a screen away from what shows: their views leave the host (`remove`), and layout keeps each as a box of its last size, so the scroll height and every position stay right. Rows come back (`insert`) within a screen of the visible part, laid out on their own at the width they had, so the list around them does not move. Hosts need nothing for this beyond the ops they already handle. The web build keeps every row in the DOM.

Measured with `people` at 50,000 rows (`bun test/people.bench.ts`, and the simulator and emulator):

| | Before | Now |
| --- | --- | --- |
| Views on the host | every row: 8 views each | ~40 rows, however many are loaded |
| iOS (UIKit), memory | 2.2 GB and a blank screen at 10,000 rows | 509 MB at 50,000, of which 4 MB is Core Animation |
| Android, memory | out of memory before 10,000 (192 MB Java heap) | runs at 50,000: Java heap under 100 MB, but QuickJS holds 1.96 GB (545 MB at 20,000), and a tap takes 193 ms |
| JS, page load at 50,000 (no JIT) | 259 ms (JIT) | 7.3 ms (16 ms) |
| JS, scroll step at 50,000 (no JIT) | — | 0.1 ms (0.2 ms) |

Limits: only lists reached through columns from the screen are culled, not a list inside a row. A single render of thousands of rows creates them all once before parking them. JS still holds every row's nodes: about 7 KB a row in JavaScriptCore and 27 to 39 KB in QuickJS, and its O(rows) passes (the list diff, a list's child arrays) are slow in QuickJS, so on Android the practical ceiling is about 20,000 rows.

## Video

`video({ src: "assets/clip.mp4", controls: true, playsInline: true })` plays a bundled file in the platform's own player, paused on its first frame until the user plays it. Its box is its `width`/`height`, else the width it gets at 16:9, and the picture is fitted inside it on black. The native hosts always show their player's controls and ignore `controls`, `poster` and `playsInline`; those are for the web build, where it is a plain `<video>`. One H.264 MP4 plays everywhere.

| Target | Player | Checked |
| --- | --- | --- |
| iOS | `AVPlayerViewController` | Not run: no Swift toolchain where this was written |
| macOS | `AVPlayerView`, inline controls | Not run, as iOS |
| Android | `VideoView` and `MediaController` (tap for the controls); the asset is copied to the cache, since `VideoView` plays files | Emulator: first frame, controls, plays |
| Linux | `Gtk.Video` (GStreamer), its controls over the picture | GTK 4 on Ubuntu: first frame, plays |
| Windows | `MediaElement` and a play/pause button: WPF has no player controls | Compiles (against .NET 10) |
| Web | `<video>` | Chromium: plays |
| GPUI | none: the box on black with a play glyph | Compiles |

A player holds a decoder, so a long list should show posters and open a player on tap, as `chirp` does.

## How it works

```
your app + nuclo (unmodified)
        │  DOM calls
        ▼
src/dom.ts — a ~370-line "native DOM"
        │  one JSON batch of ops per render()/update()
        ▼
host (one small file per platform) → native widgets
        │
        └─ events back: __nuclo_event(id, type, value)
```

nuclo already updates the DOM directly, with no virtual DOM. So the native DOM only records what nuclo does. There is no tree diff, no reconciler and no shadow tree. A counter click sends one op: `["set", 6, "text", "Count: 1"]`.

The whole host contract is seven ops and one callback:

| Op | Meaning |
| --- | --- |
| `["create", id, kind]` | `view`, `text`, `button`, `input`, `checkbox`, `image` or `video`; navigation: `tabs`, `stack`, `screen` |
| `["insert", parentId, id, beforeId]` | Insert or move. `beforeId` 0 appends. |
| `["remove", id]` | Detach and destroy the subtree |
| `["set", id, key, value]` | `text`, `value`, `checked`, `placeholder`, `type`, `disabled`, `src`; `title` (screen, or a stack's tab), `icon` (a stack's tab), `selected` (tabs) |
| `["style", id, key, value]` | A camelCase CSS subset |
| `["listen", id, type]` | `click`, `input`, `change` |
| `["frame", id, x, y, w, h]` | Where JS laid the node out (see [Styling](#styling-the-same-pixels-everywhere)) |

The host exposes `__nuclo_host(json)` and calls `__nuclo_event(id, type, value?)`: `click`, `input` (value: text), `change` (value: checked), `scroll` on a layout root (value: `"y h"`, its scroll offset and visible height), `pop` on a stack (value: depth left after a native back) and `select` on the tabs (value: index). JS turns `scroll` into the route's `onEndReached`. Both take only strings and numbers, so any JS engine can bridge them.

Navigation: screens go into stacks, stacks into tabs, and a tabs or stack inserted into the body is the window's root navigation. At the end of each batch the host compares every stack with what it shows: a new top screen is a push, a removed top screen a pop, both animated the platform's way.

Only nodes attached under `document.body` exist natively. Trees built off-document, `list()` templates and comment markers send nothing until they are attached.

## Styling: the same pixels everywhere

A style lays out to the same boxes, and its text to the same lines, on every host. The browser's CSS is the reference. The native hosts and GPUI do no styling or layout of their own: JS resolves every node's style (`src/style.ts`) and one engine (`src/layout.ts`, CSS flexbox, like React Native's Yoga) computes every frame; the hosts paint what they are told and place views where JS says.

**Where styles come from.** As in the browser: nuclo's `css()`, `createCss()` (tokens and `screens`), `cx()`, `variants()` and `globalStyle()` rules, then the inline `style`. The native runtime reads nuclo's stylesheet (`getCssText()`) and matches its rules to each element by class and tag, in specificity and source order; `@media` conditions (`min-width`, `max-width`, `min-height`, `max-height`, `orientation`) follow the window, so a resize that crosses a breakpoint restyles and lays out again. `color`, `fontSize`, `fontWeight`, `fontFamily` and `textAlign` inherit. Shorthands (`padding: "4px 8px"`, `border`, `flex`, `gap`, `background`…), kebab-case keys, `px`/`rem`/`em`/`%` and every CSS colour format work. Rules with pseudo-classes, attribute selectors or combinators (`:hover`, `.a > .b`), and `@keyframes`, do not apply on native.

**The contract** (the header of `src/layout.ts`):

- **Units.** 1 = 1 CSS px = 1 pt (Apple) = 1 dp (Android) = 1 logical px (GTK, GPUI) = 1 DIP (WPF).
- **Boxes.** `box-sizing: border-box`; `width`/`height` in px or % of the parent's content box, with `min*`/`max*`; `padding`, `border` and `margin` per side (`margin: auto` takes free space). Every container is a flex container, a column unless `flexDirection: "row"` (or `-reverse`), and the containing block of its `position: "absolute"` children; `position: "relative"` shifts a box by its insets; `display: "none"` removes one.
- **Flex.** `flexWrap`, `justifyContent` (start, center, end, space-between, -around, -evenly), `alignItems`, `alignSelf`, `alignContent`, `gap`/`rowGap`/`columnGap`, `flexGrow`, `flexShrink`, `flexBasis` and `flex`, with CSS's flexible-length algorithm. `flex: n` grows n from a basis of 0, as in CSS. Children only shrink when they set `flexShrink` (the web build sets `flex-shrink: 0` and `min-width`/`min-height: 0`, as React Native does).
- **Text.** One bundled font, Inter (`fonts/`, SIL OFL), 14 px by default, weight 400 or 700 (`bold` or ≥ 600); `fontFamily: "system"` opts a text into the OS font. Line height 1.35 × size, text wraps at its box. As in the browser, which lays text out in device pixels: the line height sits on a 1/64 device-pixel grid, and the baseline is the font's ascent and descent each rounded to device pixels, with half the leading above them floored to a device pixel. The default colour is black (white in dark mode on the native hosts).
- **Controls.** The native control, fitted into a contract box: a checkbox is 24 × 24; an input is one line plus its padding (8 by default: 34.9 tall at 14 px), its content 144 wide (160 with the default padding) unless stretched or sized, its text centred and in by its padding; a button is its text plus 8 / 16 padding; an image takes `width`/`height` or its natural size and aspect, cropped to fill; a video takes `width`/`height`, else the width it is given at 16:9, its picture fitted inside on black.
- **Paint.** `backgroundColor`, `color`, `opacity`, `borderRadius`, borders (`borderWidth` per side, one `borderColor`), `overflow: "hidden"` (clips the children; an inline `borderRadius` sets it, on the web too), `textAlign`. A radius is uniform on native: the top-left corner's.

**What a host paints.** `["style", id, key, value]` ops carry only computed paint, and `""` means back to the default: `backgroundColor`, `color` and `borderColor` as `#rrggbb` or `#rrggbbaa`; `opacity`; `fontSize`, `fontWeight`, `fontFamily`, `textAlign`; `borderRadius`; `borderWidth` as `"t r b l"`, drawn inside the frame without moving the children; `overflow: "hidden"`; `display: "none"`; and, for a text, button or input, `padding` as `"t r b l"`: where its text sits in its frame (padding plus border).

**What a host does.** Hosts get layout as frames and answer three questions:

| Call | Meaning |
| --- | --- |
| `["frame", id, x, y, w, h]` | An op: the node's box, relative to its parent's. A layout root's (the body, or a screen) is `[0, 0, w, content height]`: a screen scrolls to it. Sent after the batch that changed something, as a second batch. |
| `__nuclo_measure(id, maxWidth) → "w h"` | The content size of a text, button or image (natural size) with its current text and font, at most `maxWidth` wide (-1: unconstrained). Widths round up to 1/100. |
| `__nuclo_text_size(text, size, bold, system, maxWidth) → "w h"`, `__nuclo_image_size(src) → "w h"` | Optional: the same sizes without a node, so JS asks once per distinct text or image, not once per node. Android has them. |
| `__nuclo_event(rootId, "resize", "w h scale")` | A layout root's size and the device pixels per unit: the window's content for the body, the screen's width for a screen. |
| `__nuclo_device("frames") → {id: [x, y, w, h]}` | Debug: every view's frame as placed, for the check below. |

Hosts snap each box's edges to device pixels from its position on screen, as the browser paints boxes, and draw text line by line at the contract's baselines from the unsnapped position. `hosts/apple/main.swift` is the reference (`Typeset`, `baseline`, `TextView`, `snapFrames`).

**Checking it.** `examples/styles` shows one labelled case per rule, css() classes and responsive `screens` included, with a "Run check" button (`nuclo-native/check`). On the web it styles every element as the native runtime does (`src/style.ts`), lays the screen out with the engine, measuring text the browser's way, and compares every box with `getBoundingClientRect`. On a native host it compares the frames JS sent with the views' real frames (a native host keeps only the rows near the screen, so it checks those). Either way the screen says "N/N boxes match". The rows marked "176" ran before the box model, css() and responsive styles (when the page had 176 boxes) and have not run since.

| Host | Check | Against the browser, pixel by pixel |
| --- | --- | --- |
| Web (Chrome) | 355/355 at 375, 420, 700 and 1024 wide (both sides of each breakpoint) | Is the reference |
| macOS | 176/176 | Headless Chrome, same width, 2×: every box edge on the same device pixel; text at the same baselines and advances, glyph anti-aliasing apart. Controls are AppKit's |
| iOS (simulator) | 176/176 | Chrome at 3×, 402 wide: the same, over the first screen. Controls are UIKit's |
| Android (emulator, API 37) | 176/176 | Chrome at 2.625×: box edges and text baselines on the same device pixels, glyph anti-aliasing apart. Its 411.43-dp width against Chrome's 411 px moves right-hand edges 1 px. Controls are Material's |
| Linux (GTK 4.24 on Linux, light and dark) | 356/356 at 1× (`NUCLO_SELFTEST=1` prints it); at 2×, every box near the screen | Chrome at 1×, 420 wide, the whole page: 1,502 of 2.2 M pixels differ, all in the controls and two glyphs' anti-aliasing; borders, wrapping, positioning and css() cases are pixel for pixel. Controls are GTK's; Adwaita's checkbox is 26 px, a pixel past its box on each side |
| Windows | Not run | `dotnet build`: 0 warnings, 0 errors. The input's and checkbox's fit in their boxes is unverified |
| ios-gpui (simulator) | 176/176 | The same as iOS. The button and checkbox are the look's |
| macos-gpui | 176/176 (`NUCLO_CHECK=1` logs it) | Not captured: no screen-recording permission here |
| linux-gpui (Wayland, and X11 at 2×) | 356/356 at 2×; at 1×, every box near the screen | Chrome at 1×, 4,200 px of the page: apart from the look's own button, about 4,500 pixels differ, in controls and anti-aliasing; text on the same pixels as the GTK host (grayscale, as Chrome). The button and checkbox are the look's |

## Hosts

| Target | Host | JS engine | Drawn with | Status |
| --- | --- | --- | --- | --- |
| `ios` | `hosts/apple` | JavaScriptCore | UIKit | Simulator: tabs, push, edge-swipe and button back, re-tap to root, JS kept in sync |
| `macos` | `hosts/apple` | JavaScriptCore | AppKit | Ran scripted: sidebar, toolbar back, titles, push/pop, JS in sync. Trackpad swipe and ⌘[ not exercised |
| `android` | `hosts/android` | QuickJS-NG (NDK) | Android Views | API 37 emulator: tabs, push, back key, edge swipe with the predictive-back card, up arrow, re-tap, ripples |
| `linux` | `hosts/linux/host.js` | GJS | GTK 4 + libadwaita | Linux (GNOME, Wayland) and macOS (Homebrew GTK): tabs, push, native back with JS sync. Swipe and Alt+← not driven |
| `windows` | `hosts/windows` | Jint | WPF (Fluent) | Compiles with the .NET 11 SDK, 0 warnings (also with `-warnaserror`). Never launched |
| `web` | `hosts/web` + `src/web.ts` | the browser's | the DOM | Browser: push, pop and tab transitions, back button, URL |
| `ios-gpui` | `hosts/gpui` | QuickJS (rquickjs) | GPUI via gpui-mobile (Metal) | Simulator: tabs, push, interactive edge swipe, back button, JS in sync. The other four looks previewed with `NUCLO_LOOK` |
| `macos-gpui` | `hosts/gpui` | QuickJS | GPUI (Metal) | Runs, no JS errors. Not screenshotted (no screen-recording permission); same renderer as `ios-gpui` |
| `android-gpui` | `hosts/gpui` | QuickJS | GPUI via gpui-mobile (Vulkan) | Builds; on the emulator the bundle runs, but no emulator GPU can run GPUI's renderer (GLES 3.0 lacks compute, its Vulkan is non-conformant). Needs a device |
| `linux-gpui` | `hosts/gpui` | QuickJS | GPUI (Vulkan) | Linux (GNOME): draws on Wayland and on X11 (Xwayland). Under Xvfb GPUI presents no frames, its own hello world included |
| `windows-gpui` | `hosts/gpui` | QuickJS | GPUI (DirectX) | Cross-built from macOS with MinGW (GNU ABI): compiles and links `nuclo-gpui.exe`. Never launched |

## GPUI

`hosts/gpui` is one Rust crate for all five GPUI targets. QuickJS runs the bundle; the crate keeps the op tree and draws it with GPUI each frame, every node at the frame JS laid it out at. GPUI draws its own pixels, so the router's navigation is drawn the platform's way (`src/look.rs`): the iOS floating tab bar, large titles, parallax push and edge swipe; Material 3 bars and shared-axis motion; the macOS sidebar and toolbar; the Fluent nav pane and drill-in; the Adwaita header and view switcher. `NUCLO_LOOK=ios|android|macos|windows|linux` picks a look on any machine.

Desktop builds use `gpui-pre-platform`; iOS and Android use the community [`gpui-mobile`](https://github.com/itsbalamurali/gpui-mobile) platform, pinned to a commit. Both sit on `gpui-pre =0.3.6`: gpui-mobile's latest commit still requires it, so GPUI stays there (0.3.12 is out) until gpui-mobile moves. The text field is adapted from GPUI's input example.

## Web

On the web there is no bridge: nuclo writes to the real DOM. `import "nuclo-native"` resolves to `src/web.ts` (the `web` export condition), which adds only what makes the page lay out like the native hosts:

- A zero-specificity base stylesheet: containers are flex columns, images cover their box.
- Unitless style numbers get `px` (`padding: 16` → `16px`).

Everything else the web has keeps working: `css()`, any tag, any CSS property, `fetch`, style inheritance.

`bun run build:web` writes a static site to `dist-web`:

- `app.js`: the minified bundle (about 62 KB for the showcase, nuclo included).
- `index.html`, `manifest.webmanifest`, icons: the installable shell, from `hosts/web`.
- `sw.js`: a service worker that precaches every built file, so the app works offline. Its cache name is a hash of the files, so a new build replaces the old cache.

Host `dist-web` on any static server. A service worker needs HTTPS or `localhost`.

## Run

Every target is one command, with an optional example (`showcase` by default). It builds that example's bundle (`dist/app.js` plus `dist/assets`), then builds and launches the app; app builds go to `build/<target>`. `bun run build [example]` only bundles.

```bash
bun run ios            # booted simulator; bun run ios todo, bun run ios battery…
bun run macos
bun run android        # running emulator or device
bun run linux          # gjs + GTK 4 + libadwaita
bun run windows        # on Windows
bun run web            # http://localhost:4173
bun run ios-gpui       # booted simulator
bun run macos-gpui
bun run android-gpui   # a device: emulators cannot run GPUI's renderer
bun run linux-gpui     # on Linux
bun run windows-gpui   # on Windows
bun test               # op-level tests against a mock host
bun run typecheck      # strict TypeScript over src, examples, tests and scripts
bun test/people.bench.ts  # page-load, tap and scroll timings and host views up to 50,000 rows
```

Requirements, all current releases and no package managers beyond each platform's own: Xcode 27 for the Apple targets (iOS 27 and macOS 27 deployment targets; the UIKit app uses the scene life cycle); a full JDK 17+ as `JAVA_HOME`, the Android SDK with API 37 and NDK 30.0.16248370 for Android (each project has a Gradle 9.9.1 wrapper and AGP 9.5.1, minSdk 30; `android` downloads the QuickJS-NG source on its first build); the .NET 11 SDK for Windows (Jint 4.18.0); Rust for the GPUI targets, with the `aarch64-apple-ios-sim` / `aarch64-linux-android` targets for mobile. GTK on macOS runs from Homebrew (`gjs gtk4 libadwaita gobject-introspection adwaita-icon-theme`). Android libraries are linked for 16 KB pages.

Commands behind them, if you want to run one by hand:

- **macOS:** `swiftc -swift-version 6 -target arm64-apple-macos27.0 hosts/apple/*.swift -o build/macos/nuclo-app && build/macos/nuclo-app dist/app.js` (any bundle path works, e.g. one built from another example)
- **iOS simulator:** no Xcode project. `xcrun -sdk iphonesimulator swiftc -swift-version 6 -target arm64-apple-ios27.0-simulator hosts/apple/*.swift`, then an `.app` folder with the binary, `app.js`, `assets/` and an `Info.plist` (`UILaunchScreen` included, or the app runs letterboxed, and the scene manifest naming `NucloSceneDelegate`), ad-hoc signed and installed with `xcrun simctl install booted`. `scripts/run.ts` has the exact steps.
- **iOS device:** add `hosts/apple/*.swift` and `dist/app.js` to an iOS app target, so Xcode handles signing and provisioning.
- **Android:** open `hosts/android` in Android Studio, or `./gradlew assembleDebug` there. `dist/` ships as the assets.
- **Windows:** `dotnet run` in `hosts/windows`.
- **GPUI, desktop:** `cargo run --manifest-path hosts/gpui/Cargo.toml -- dist/app.js`
- **GPUI, iOS:** `cargo rustc --lib --target aarch64-apple-ios-sim --crate-type staticlib` in `hosts/gpui` (with `LIBCLANG_PATH` at Xcode's toolchain, since rquickjs generates its mobile bindings, and `IPHONEOS_DEPLOYMENT_TARGET=17.0` for the C parts), then link `hosts/gpui/ios/main.m` against `libnuclo_gpui.a`.
- **GPUI, Android:** the same with `--target aarch64-linux-android --crate-type cdylib` and the NDK's clang as linker, the stripped `.so` in `hosts/gpui/android/app/build/jniLibs/arm64-v8a`, then `./gradlew assembleDebug` in `hosts/gpui/android`. Bindgen needs `--target=aarch64-linux-android30` in `BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android` with NDK 30.

## What the POC supports

- **Tags:** `button`, `input` (text, password, checkbox), `textarea`, `img`, `video`. Text tags (`span`, `p`, `h1`–`h6`, `label`, `strong`…) become one label holding their whole text. Every other tag is a flex container, column by default.
- **Styles:** inline `style`, `css()`, `createCss()` with `screens`, `cx()`, `variants()` and `globalStyle()` by tag or class: flexbox layout, the box model, positioning and paint, laid out the same everywhere and responsive to the window ([Styling](#styling-the-same-pixels-everywhere)). Text properties inherit. Text collapses whitespace as CSS does.
- **Images:** `img({ src })` loads a file relative to the bundle: its natural size and aspect, or the box you give it, cropped to fill.
- **Video:** see [Video](#video).
- **Events:** `click` on anything, `input` on text inputs, `change` on Enter and on checkbox toggles. Events do not bubble.
- **nuclo features:** all of nuclo's API: reactive text, attributes, classes and styles, `list()`, `when()`/`else()`, `region()`/`into()`, `scope()` and `update(scope)`, `forceUpdate()`, `on()` with `mount` and `destroy` (`test/api.test.ts`). `hydrate()` and `renderToString()` are for the web and the server.
- **Navigation:** `nuclo-native/router`, with each platform's tabs, stacks, transitions and back gestures.

## Not done

- On native: `:hover`, `:focus` and other pseudo-classes, combinator selectors, `@keyframes`/`transition`, `box-shadow`, `lineHeight`, `letterSpacing`, `fontStyle`, `transform`, `zIndex`, `order`, `aspectRatio`, `baseline` alignment, per-corner radii and per-side border colours. They still work on the web.
- On Windows: placeholders and password fields. On Apple: password fields.
- Moving a window to a screen of another scale does not lay it out again on Linux and Windows.
- Remote images and videos. `src` is a bundled file.
- On the web, `router.back()` is the browser's back, so it leaves the app when a detail screen was opened directly from a link. Tabs there reset instead of keeping a stack each.
- Timers and `fetch` on the bare engines (JavaScriptCore, QuickJS, Jint). GJS has them. The GPUI host forwards `console` to its log.
- Scrolling on Apple outside the router: a plain app without `router.outlet` does not scroll.
- GPUI: no video playback (a `video` is its box on black with a play glyph). Android's predictive-back progress is not wired (the back key pops with Material motion); the iOS look's bars are drawn, not Liquid Glass.
- Hot reload and packaging for app stores.
- Long lists keep every row's nodes in JS ([Long lists](#long-lists)): QuickJS on Android holds 27 to 39 KB a row. Not keeping JS nodes for far rows needs a virtual `list()` in nuclo itself.
