# nuclo-native (POC)

Write a normal nuclo app. It renders with real native widgets — no webview — on Android, iOS, macOS, Windows and Linux, and builds as a web app (SPA and installable PWA) from the same source.

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

The showcase app (`example/app.ts`) on Linux, GTK 4:

![Linux](docs/linux.png)

The same bundle on Android, platform Views:

![Android](docs/android.png)

## The showcase

`example/app.ts` is a three-tab app built only from nuclo calls and inline styles:

- **Dashboard** (`/`): stat cards, a bar chart that resizes when you switch Week / Month / Year and highlights the bar you tap, and horizontal share bars. Charts are plain views with a `height` or `width`, so they need no canvas.
- **Gallery** (`/gallery`, `/gallery/:id`): an image grid that pushes a detail screen with a route parameter, a like toggle and a back link.
- **Account** (`/account`): text, email and password fields, a segmented choice, checkboxes, validation messages and a success state.

Routing comes from `nuclo-native/router`, a small stack router:

```ts
import { createRouter } from "nuclo-native/router";

export const router = createRouter({
  "/": Dashboard,
  "/gallery/:id": PhotoDetail, // receives { id }
});

router.go("/gallery/dunes"); // push
router.back();               // pop
router.reset("/");           // switch tab
router.outlet();             // where the current screen renders
```

Native keeps its own stack. On the web the route lives in the URL hash (`#/gallery/dunes`) and the browser history is the stack, so links, reloads and the browser's back button work on any static host.

`nuclo-router` itself needs `URL`, `history` and `location`, which the bare JS engines do not have.

`example/todo.ts` is the smaller counter and todo example.

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

The whole host contract is six ops and one callback:

| Op | Meaning |
| --- | --- |
| `["create", id, kind]` | `view`, `text`, `button`, `input`, `checkbox` or `image` |
| `["insert", parentId, id, beforeId]` | Insert or move. `beforeId` 0 appends. |
| `["remove", id]` | Detach and destroy the subtree |
| `["set", id, key, value]` | `text`, `value`, `checked`, `placeholder`, `type`, `disabled`, `src` |
| `["style", id, key, value]` | A camelCase CSS subset |
| `["listen", id, type]` | `click`, `input`, `change` |

The host exposes `__nuclo_host(json)` and calls `__nuclo_event(id, type, value?)`. Both take only strings and numbers, so any JS engine can bridge them.

Only nodes attached under `document.body` exist natively. Trees built off-document, `list()` templates and comment markers send nothing until they are attached.

## Hosts

| Platform | Host | JS engine | Widgets | Status |
| --- | --- | --- | --- | --- |
| Linux | `hosts/linux/host.js` | GJS (SpiderMonkey) | GTK 4 | Ran the showcase; every route, the chart, images and the form checked |
| Android | `hosts/android` | QuickJS-NG, built with the NDK | Android Views | Ran the showcase in a 16 KB-page emulator; every route, the chart, images and the form checked |
| Windows | `hosts/windows` | Jint | WPF | Compiles; the bundle runs in Jint. The UI was never launched. |
| macOS, iOS | `hosts/apple/main.swift` | JavaScriptCore | AppKit, UIKit | macOS: compiles with Swift 6.4 and ran the showcase dashboard. iOS: ran the showcase in the simulator; the dashboard, the gallery tab and images checked. |
| Web | `hosts/web` + `src/web.ts` | The browser's | The real DOM | Ran the showcase in a browser; routes, deep links, the form and offline reload checked |

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

```bash
bun run build      # example/app.ts → dist/app.js (one file, nuclo included) plus dist/assets
bun run linux      # needs gjs and GTK 4
bun run web        # builds dist-web and serves it on http://localhost:4173
bun test           # op-level tests against a mock host
```

- **Android:** open `hosts/android` in Android Studio, or run `gradle assembleDebug` there with JDK 17. It needs NDK 27.1.12297006 and downloads the QuickJS-NG source on the first build. `dist/app.js` ships as an asset. The native library is linked for 16 KB pages.
- **Windows:** `dotnet run` in `hosts/windows`.
- **macOS:** `swiftc -swift-version 6 hosts/apple/main.swift -o dist/nuclo-app && dist/nuclo-app dist/app.js`
- **iOS simulator:** no Xcode project needed. Compile the same file for the simulator, wrap it in an `.app` with the bundle, and install it on the booted simulator:

  ```bash
  mkdir -p dist/NucloApp.app
  xcrun -sdk iphonesimulator swiftc -swift-version 6 -target arm64-apple-ios17.0-simulator hosts/apple/main.swift -o dist/NucloApp.app/NucloApp
  cp -R dist/app.js dist/assets dist/NucloApp.app/
  cat > dist/NucloApp.app/Info.plist <<'EOF'
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0"><dict>
  	<key>CFBundleIdentifier</key><string>dev.nuclo.native</string>
  	<key>CFBundleExecutable</key><string>NucloApp</string>
  	<key>CFBundleName</key><string>nuclo</string>
  	<key>CFBundlePackageType</key><string>APPL</string>
  	<key>CFBundleVersion</key><string>1</string>
  	<key>CFBundleShortVersionString</key><string>0.0.0</string>
  	<key>UILaunchScreen</key><dict/>
  </dict></plist>
  EOF
  codesign -s - --force dist/NucloApp.app
  xcrun simctl install booted dist/NucloApp.app && xcrun simctl launch booted dev.nuclo.native
  ```

  Plain `swiftc` links against the macOS SDK, hence `xcrun -sdk iphonesimulator`. Without `UILaunchScreen` the app runs letterboxed.
- **iOS device:** add `hosts/apple/main.swift` and `dist/app.js` to an iOS app target, so Xcode handles signing and provisioning.

## What the POC supports

- **Tags:** `button`, `input` (text, password, checkbox), `textarea`, `img`. Text tags (`span`, `p`, `h1`–`h6`, `label`, `strong`…) become one label holding their whole text. Every other tag is a flex container, column by default.
- **Styles (inline `style` only):** `flexDirection`, `gap`, `alignItems`, `flex`, `padding`, `width`, `height`, `color`, `backgroundColor`, `borderRadius`, `fontSize`, `fontWeight`, `textAlign`, `opacity`. Linux also takes `margin` and `border`. Styles do not inherit: set `color` on the text itself.
- **Images:** `img({ src })` loads a file relative to the bundle and fills its box, cropped. Give it a `height`.
- **Events:** `click` on anything, `input` on text inputs, `change` on Enter and on checkbox toggles. Events do not bubble.
- **nuclo features:** reactive text, attributes and styles, `list()`, `when()`, `update()`.
- **Routing:** `nuclo-native/router`.

## Not done

- `css()` and class names. Only inline styles reach the host.
- `flex` weights on Linux: every growing child gets an equal share, whatever the number.
- On Windows: `borderRadius`, placeholders and password fields. On Apple: text wrapping, password fields, and images are fitted, not cropped, on macOS.
- Remote images. `src` is a bundled file.
- The Android back button does not call `router.back()` yet.
- On the web, `router.back()` is the browser's back, so it leaves the app when a detail screen was opened directly from a link.
- Timers, `fetch` and `console` on the bare engines (JavaScriptCore, QuickJS, Jint). GJS has them.
- Scrolling on Apple. The other hosts wrap the root in a scroll view.
- Hot reload, a CLI, and packaging for app stores.
