// The renderer of ui.ns and store.ns for iOS and macOS: the bodies of their `extern` declarations, over the
// Swift runtime of nuclo (runtime/ios: UIKit; on macOS the same file over AppKit through runtime/macos).
//
// The runtime is compiled as its own module, `Nuclo` (scripts/ios.sh, scripts/macos.sh): the app's
// generated types (`Style`, `Mod`, `Tab`...) and the runtime's have the same names, so every runtime name
// here is written `Nuclo.x`. The generated code is not isolated to the main actor; it only ever runs there
// (UI events, timers), so each entry point into the runtime is `MainActor.assumeIsolated`.

import Foundation
import Nuclo
import SQLite3
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

public typealias View = any Nuclo.NodeMod
public typealias StyleResult = Nuclo.StyleClass

@inline(__always) private func ui<T>(_ body: @MainActor () -> T) -> T { MainActor.assumeIsolated(body) }

// ---- styles -----------------------------------------------------------------------------

private func direction(_ v: String?) -> Nuclo.FlexDirection? { v == "row" ? .row : v == "column" ? .column : nil }

private func align(_ v: String?) -> Nuclo.Align? {
  switch v {
  case "flex-start", "start": return .flexStart
  case "center": return .center
  case "flex-end", "end": return .flexEnd
  case "stretch": return .stretch
  default: return nil
  }
}

private func display(_ v: String?) -> Nuclo.Display? { v == nil ? nil : v == "none" ? Nuclo.Display.none : .flex }

/// A state or a breakpoint: the keys of `Look`.
private func look(_ l: Look) -> Nuclo.Style {
  Nuclo.Style(
    flexDirection: direction(l.flexDirection), flex: l.flex, gap: l.gap,
    padding: l.padding, paddingTop: l.py, paddingRight: l.px, paddingBottom: l.py, paddingLeft: l.px,
    width: l.width, height: l.height, maxWidth: l.maxWidth, display: display(l.display),
    backgroundColor: l.backgroundColor, color: l.color, opacity: l.opacity, borderColor: l.borderColor,
    fontSize: l.fontSize, scale: l.scale
  )
}

/// nuclo-core's style object as the runtime's style. A string the runtime has no value for is left unset.
public func css(_ s: Style) -> StyleResult {
  ui {
    var media: [Nuclo.MediaRule] = []
    if let m = s.md { media.append(Nuclo.MediaRule(720, nil, look(m))) }
    if let l = s.lg { media.append(Nuclo.MediaRule(1080, nil, look(l))) }
    return Nuclo.css(Nuclo.Style(
      flexDirection: direction(s.flexDirection), alignItems: align(s.alignItems), alignSelf: align(s.alignSelf),
      justifyContent: {
        switch s.justifyContent {
        case "flex-start", "start": return .flexStart
        case "center": return .center
        case "flex-end", "end": return .flexEnd
        case "space-between": return .spaceBetween
        case "space-around": return .spaceAround
        case "space-evenly": return .spaceEvenly
        default: return nil
        }
      }(),
      flexWrap: s.flexWrap == "wrap" ? .wrap : s.flexWrap == "nowrap" ? .nowrap : nil,
      flex: s.flex, gap: s.gap, margin: s.margin,
      marginTop: s.mt ?? s.my, marginRight: s.mr ?? s.mx, marginBottom: s.mb ?? s.my, marginLeft: s.ml ?? s.mx,
      padding: s.padding, paddingTop: s.pt ?? s.py, paddingRight: s.pr ?? s.px, paddingBottom: s.pb ?? s.py, paddingLeft: s.pl ?? s.px,
      width: s.width, widthPct: s.widthPct, height: s.height, minWidth: s.minWidth, maxWidth: s.maxWidth,
      minHeight: s.minHeight, maxHeight: s.maxHeight, aspectRatio: s.aspectRatio,
      overflow: s.overflow == "scroll" ? .scroll : s.overflow == "hidden" ? .hidden : s.overflow == "visible" ? .visible : nil,
      position: s.position == "absolute" ? .absolute : s.position == "relative" ? .relative : nil,
      top: s.top, right: s.right, bottom: s.bottom, left: s.left, zIndex: s.zIndex, display: display(s.display),
      backgroundColor: s.backgroundColor, color: s.color, opacity: s.opacity,
      borderRadius: s.borderRadius, borderWidth: s.borderWidth, borderColor: s.borderColor,
      borderTopWidth: s.borderTopWidth, borderBottomWidth: s.borderBottomWidth,
      shadowColor: s.shadowColor, shadowRadius: s.shadowRadius, shadowOffsetX: s.shadowRadius == nil ? nil : 0, shadowOffsetY: s.shadowOffsetY,
      fontSize: s.fontSize,
      fontWeight: {
        switch s.fontWeight {
        case "light", "300": return .light
        case "normal", "400": return .normal
        case "medium", "500": return .medium
        case "semibold", "600": return .semibold
        case "bold", "700": return .bold
        default: return nil
        }
      }(),
      fontStyle: s.fontStyle == "italic" ? .italic : s.fontStyle == "normal" ? .normal : nil,
      fontFamily: s.fontFamily, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing,
      textAlign: s.textAlign == "left" ? .left : s.textAlign == "center" ? .center : s.textAlign == "right" ? .right : nil,
      textDecoration: s.textDecoration == "underline" ? .underline : s.textDecoration == "line-through" ? .lineThrough : s.textDecoration == "none" ? Nuclo.TextDecoration.none : nil,
      textTransform: {
        switch s.textTransform {
        case "none": return Nuclo.TextTransform.none
        case "uppercase": return .uppercase
        case "lowercase": return .lowercase
        case "capitalize": return .capitalize
        default: return nil
        }
      }(),
      numberOfLines: s.numberOfLines,
      objectFit: s.objectFit == "contain" ? .contain : s.objectFit == "fill" ? .fill : s.objectFit == "cover" ? .cover : nil,
      pointerEvents: s.pointerEvents == "none" ? Nuclo.PointerEvents.none : s.pointerEvents == "auto" ? .auto : nil,
      translateX: s.translateX, translateY: s.translateY, scale: s.scale, rotate: s.rotate,
      transitionDuration: s.transition,
      transitionEasing: {
        switch s.easing {
        case "linear": return .linear
        case "ease": return .ease
        case "ease-in": return .easeIn
        case "ease-out": return .easeOut
        case "ease-in-out": return .easeInOut
        case "spring": return .spring
        default: return nil
        }
      }(),
      media: media.isEmpty ? nil : media,
      pressed: s.pressed.map(look),
      hover: s.hover.map(look)
    ))
  }
}

// ---- builders -------------------------------------------------------------------------------

private func point(_ e: Nuclo.PointerEvent) -> Point { Point(x: e.x, y: e.y, pageX: e.pageX, pageY: e.pageY) }

@MainActor private func attributes(_ a: Attributes) -> [(any Nuclo.NodeMod)?] {
  var m: [(any Nuclo.NodeMod)?] = []
  if let f = a.className { m.append(Nuclo.A.className { f() }) }
  if let f = a.value { m.append(Nuclo.A.value { f() }) }
  if let f = a.checked { m.append(Nuclo.A.checked { f() }) }
  if let url = a.src { m.append(Nuclo.A.src(url)) }
  if let text = a.placeholder { m.append(Nuclo.A.placeholder(text)) }
  if let text = a.label { m.append(Nuclo.A.ariaLabel(text)) }
  if let t = a.inputType { m.append(Nuclo.A.inputType(t)) }
  if let f = a.onClick { m.append(Nuclo.A.onClick { _ in f() }) }
  if let f = a.onInput { m.append(Nuclo.A.onInput { e in f(e.target.value) }) }
  if let f = a.onChange { m.append(Nuclo.A.onChange { e in f(e.target.checked) }) }
  if let f = a.onKeyDown { m.append(Nuclo.A.onKeyDown { e in f(e.key) }) }
  if let f = a.onPan {
    m.append(Nuclo.A.onPan { e in f(Pan(state: e.state, dx: e.translationX, dy: e.translationY, vx: e.velocityX, vy: e.velocityY, x: e.x, y: e.y)) })
  }
  if let f = a.onPinch { m.append(Nuclo.A.onPinch { e in f(Pinch(state: e.state, scale: e.scale)) }) }
  if let f = a.onLongPress { m.append(Nuclo.A.onLongPress { e in f(point(e)) }) }
  if let f = a.onDoubleClick { m.append(Nuclo.A.onDoubleClick { e in f(point(e)) }) }
  if let f = a.onPointerDown { m.append(Nuclo.A.onPointerDown { e in f(point(e)) }) }
  if let f = a.onPointerUp { m.append(Nuclo.A.onPointerUp { e in f(point(e)) }) }
  if let f = a.onScroll { m.append(Nuclo.A.onScroll { e in f(Scroll(top: e.scrollTop, height: e.scrollHeight, viewport: e.clientHeight)) }) }
  if let f = a.onDestroy { m.append(Nuclo.A.onDestroy { _ in f() }) }
  return m
}

public func el(_ tag: String, _ mods: [Mod]) -> View {
  ui {
    var m: [(any Nuclo.NodeMod)?] = []
    for mod in mods {
      switch mod {
      case .part(let v): m.append(v)
      case .text(let s): m.append(Nuclo.A.text(s))
      case .textOf(let f): m.append(Nuclo.A.text { f() })
      case .class(let c): m.append(c)
      case .classOf(let f): m.append(Nuclo.A.className { f() })
      case .attrs(let a): m.append(contentsOf: attributes(a))
      }
    }
    switch tag {
    case "div": return Nuclo.div(Fragment(m))
    case "h1": return Nuclo.h1(Fragment(m))
    case "h2": return Nuclo.h2(Fragment(m))
    case "h3": return Nuclo.h3(Fragment(m))
    case "p": return Nuclo.p(Fragment(m))
    case "span": return Nuclo.span(Fragment(m))
    case "small": return Nuclo.small(Fragment(m))
    case "strong": return Nuclo.strong(Fragment(m))
    case "button": return Nuclo.button(Fragment(m))
    case "input": return Nuclo.input(Fragment(m))
    case "textarea": return Nuclo.textarea(Fragment(m))
    case "img": return Nuclo.img(Fragment(m))
    case "checkbox": return Nuclo.checkbox(Fragment(m))
    default: return Nuclo.el(tag, Fragment(m))
    }
  }
}

/// Applies a list of mods to the node, in order: a builder's arguments made at run time (Swift has no
/// splat of an array into the runtime builders' `NodeMod?...`).
private struct Fragment: Nuclo.NodeMod {
  let mods: [(any Nuclo.NodeMod)?]
  init(_ mods: [(any Nuclo.NodeMod)?]) { self.mods = mods }
  func apply(to node: Nuclo.Node) {
    for m in mods { m?.apply(to: node) }
  }
}

/// A row's item, kept by identity: the runtime matches rows by identity, so an item equal to one of the
/// last call keeps its box (and its row), and a changed item gets a new box (a new row).
private final class Box<T> {
  let value: T
  init(_ value: T) { self.value = value }
}

public func list<T: Equatable>(_ items: @escaping () -> [T], _ render: @escaping (T, Int32) -> View) -> View {
  ui {
    var last: [Box<T>?] = []
    return Nuclo.list({ () -> Nuclo.JsArray<Box<T>> in
      var old = last
      let next: [Box<T>] = items().enumerated().map { i, x in
        if i < old.count, let o = old[i], o.value == x { old[i] = nil; return o }
        if let j = old.firstIndex(where: { $0?.value == x }) { let o = old[j]!; old[j] = nil; return o }
        return Box(x)
      }
      last = next
      return Nuclo.JsArray(next)
    }, { box, i in render(box.value, Int32(i)) as? Nuclo.Node })
  }
}

/// A `when` branch is made each time it opens.
public func when(_ cond: @escaping () -> Bool, _ show: @escaping () -> View) -> View {
  ui { Nuclo.when({ cond() }, { [show()] }) }
}

public func update() {
  ui { Nuclo.update() }
}

// ---- navigation --------------------------------------------------------------------------------

public struct Route {
  let pattern: String
  let title: (String) -> String
  let view: (String) -> View
  let kind: String
}

public func route(_ pattern: String, _ title: @escaping (String) -> String, _ view: @escaping (String) -> View, _ kind: String) -> Route {
  Route(pattern: pattern, title: title, view: view, kind: kind)
}

nonisolated(unsafe) private var router: Nuclo.NRouter?

public func navigate(_ routes: [Route], _ tabs: [Tab]) {
  ui {
    let start = ProcessInfo.processInfo.environment["NUCLO_PATH"] ?? "/"
    let r = Nuclo.NRouter(
      routes: routes.map { r in
        Nuclo.NRoute(
          r.pattern,
          { params in (r.view(params["id"] ?? "") as? Nuclo.Node) ?? Nuclo.div() },
          title: { params in r.title(params["id"] ?? "") },
          presentation: r.kind == "modal" ? "modal" : "push",
          header: r.kind == "push"
        )
      },
      tabs: tabs.map { Nuclo.NTab($0.path, $0.title, $0.icon) },
      initial: start
    )
    router = r
    Nuclo.render(r)
  }
}

public func go(_ path: String) { ui { router?.go(path) } }
public func back() { ui { router?.back() } }
public func reset(_ path: String) { ui { router?.reset(path) } }

public func overlay(_ view: @escaping () -> View) {
  ui { Nuclo.render { (view() as? Nuclo.Node) ?? Nuclo.div() } }
}

// ---- platform -----------------------------------------------------------------------------------

public func later(_ ms: Int32, _ f: @escaping () -> Void) {
  ui { _ = Nuclo.setTimeout({ f() }, Double(ms)) }
}

// ---- the platform's own components ---------------------------------------------------------------

private func native(_ actions: [Action]) -> [Nuclo.NativeAction] { actions.map { a in Nuclo.NativeAction(a.label, a.kind, a.run) } }

public func nativeAlert(_ title: String, _ message: String, _ actions: [Action]) -> Bool {
  ui { Nuclo.NativeUi.alert(title, message, native(actions)) }
}

public func nativeActions(_ title: String, _ actions: [Action]) -> Bool {
  ui { Nuclo.NativeUi.actions(title, native(actions)) }
}

public func nativeMenu(_ x: Double, _ y: Double, _ title: String, _ actions: [Action]) -> Bool {
  ui { Nuclo.NativeUi.menu(x, y, title, native(actions)) }
}

public func nativeSheet(_ title: String, _ detent: String, _ content: @escaping () -> View) -> Bool {
  ui { Nuclo.NativeUi.sheet(title, detent, (content() as? Nuclo.Node) ?? Nuclo.div()) }
}

public func nativeCloseSheet() -> Bool {
  ui { Nuclo.NativeUi.closeSheet() }
}

public func barButton(_ label: String, _ run: @escaping () -> Void) -> Bool {
  #if canImport(UIKit)
  ui { Nuclo.NativeUi.barActions.append(Nuclo.NativeAction(label, "default", run)) }
  return true
  #else
  return false
  #endif
}

public func shareText(_ text: String) -> Bool { ui { Nuclo.NativeUi.share(text) } }
public func copyText(_ text: String) { ui { Nuclo.NativeUi.copy(text) } }

#if canImport(UIKit)
public func hasControl(_ kind: String) -> Bool { ["segmented", "chip", "slider", "button", "spinner", "search", "stepper"].contains(kind) }

public func buttonControl(_ label: @escaping () -> String, _ kind: @escaping () -> String, _ run: @escaping () -> Void) -> View {
  ui { Nuclo.NativeControls.button(label, kind, run) }
}
public func spinnerControl() -> View { ui { Nuclo.NativeControls.spinner() } }
public func searchControl(_ placeholder: String, _ value: @escaping () -> String, _ input: @escaping (String) -> Void, _ submit: @escaping (String) -> Void) -> View {
  ui { Nuclo.NativeControls.search(placeholder, value, input, submit) }
}
public func stepperControl(_ value: @escaping () -> Int32, _ min: Int32, _ max: Int32, _ change: @escaping (Int32) -> Void) -> View {
  ui { Nuclo.NativeControls.stepper(value, min, max, change) }
}

public func segmentedControl(_ options: [String], _ at: @escaping () -> Int32, _ pick: @escaping (Int32) -> Void) -> View {
  ui { Nuclo.NativeControls.segmented(options, at, pick) }
}

public func chipControl(_ label: String, _ on: @escaping () -> Bool, _ pick: @escaping () -> Void) -> View {
  ui { Nuclo.NativeControls.chip(label, on, pick) }
}

public func sliderControl(_ value: @escaping () -> Double, _ color: String, _ change: @escaping (Double) -> Void) -> View {
  ui { Nuclo.NativeControls.slider(value, color, change) }
}
#else
/// macOS: kit.ns draws these.
public func hasControl(_ kind: String) -> Bool { false }
public func segmentedControl(_ options: [String], _ at: @escaping () -> Int32, _ pick: @escaping (Int32) -> Void) -> View { ui { Nuclo.div() } }
public func chipControl(_ label: String, _ on: @escaping () -> Bool, _ pick: @escaping () -> Void) -> View { ui { Nuclo.div() } }
public func sliderControl(_ value: @escaping () -> Double, _ color: String, _ change: @escaping (Double) -> Void) -> View { ui { Nuclo.div() } }
public func buttonControl(_ label: @escaping () -> String, _ kind: @escaping () -> String, _ run: @escaping () -> Void) -> View { ui { Nuclo.div() } }
public func spinnerControl() -> View { ui { Nuclo.div() } }
public func searchControl(_ placeholder: String, _ value: @escaping () -> String, _ input: @escaping (String) -> Void, _ submit: @escaping (String) -> Void) -> View { ui { Nuclo.div() } }
public func stepperControl(_ value: @escaping () -> Int32, _ min: Int32, _ max: Int32, _ change: @escaping (Int32) -> Void) -> View { ui { Nuclo.div() } }
#endif

/// Neither UIKit nor AppKit has a toast: kit.ns draws it.
public func nativeToast(_ text: String) -> Bool { false }

public func prefetch(_ url: String) {
  ui { Nuclo.prefetchImage(url) }
}

public func haptic(_ kind: String) {
  #if canImport(UIKit)
  ui {
    switch kind {
    case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
    case "medium": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    default: UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
  }
  #elseif canImport(AppKit)
  ui { NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .now) }
  #endif
}

public func platform() -> String { PLATFORM }

public func viewport() -> Viewport {
  ui {
    #if canImport(UIKit)
    let window = UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first
    let size = window?.bounds.size ?? UIScreen.main.bounds.size
    #elseif canImport(AppKit)
    let size = NSApp.keyWindow?.contentView?.bounds.size ?? NSSize(width: 420, height: 780)
    #else
    let size = (width: 420.0, height: 780.0)
    #endif
    return Viewport(width: Double(size.width), height: Double(size.height))
  }
}

/// The mode of the platform's own chrome: the navigation and tab bars follow the window's interface style,
/// and the accent tints the back button and the selected tab.
public func theme(_ dark: Bool, _ accent: String, _ background: String) {
  ui {
    #if canImport(UIKit)
    for scene in UIApplication.shared.connectedScenes {
      for window in (scene as? UIWindowScene)?.windows ?? [] {
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.tintColor = color(accent)
        window.backgroundColor = color(background)
      }
    }
    #elseif canImport(AppKit)
    NSApp.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
    #endif
  }
}

#if canImport(UIKit)
/// "#rrggbb" as a UIColor.
private func color(_ hex: String) -> UIColor {
  var v: UInt64 = 0
  Scanner(string: hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))).scanHexInt64(&v)
  return UIColor(red: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255, blue: CGFloat(v & 0xff) / 255, alpha: 1)
}
#endif

// ---- storage: SQLite (libsqlite3, part of the system) ----------------------------------------------

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

private final class Database: @unchecked Sendable {
  static let shared = Database()
  var db: OpaquePointer?
  let path: String

  init() {
    let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("nuclo-native-ns")
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    path = dir.appendingPathComponent("app.db").path
    _ = sqlite3_open(path, &db)
    exec("PRAGMA journal_mode = WAL")
    exec("CREATE TABLE IF NOT EXISTS rows (tbl TEXT NOT NULL, id TEXT NOT NULL, fields TEXT NOT NULL, PRIMARY KEY (tbl, id))")
  }

  func exec(_ sql: String, _ args: [String] = []) {
    var stmt: OpaquePointer?
    guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return }
    defer { _ = sqlite3_finalize(stmt) }
    for (i, a) in args.enumerated() { _ = sqlite3_bind_text(stmt, Int32(i + 1), a, -1, SQLITE_TRANSIENT) }
    _ = sqlite3_step(stmt)
  }

  func query(_ sql: String, _ args: [String]) -> [[String]] {
    var stmt: OpaquePointer?
    guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return [] }
    defer { _ = sqlite3_finalize(stmt) }
    for (i, a) in args.enumerated() { _ = sqlite3_bind_text(stmt, Int32(i + 1), a, -1, SQLITE_TRANSIENT) }
    var rows: [[String]] = []
    while sqlite3_step(stmt) == SQLITE_ROW {
      rows.append((0..<sqlite3_column_count(stmt)).map { c in sqlite3_column_text(stmt, c).map { String(cString: $0) } ?? "" })
    }
    return rows
  }
}

public func dbPut(_ table: String, _ id: String, _ fields: [String]) {
  let json = String(data: (try? JSONSerialization.data(withJSONObject: fields)) ?? Data("[]".utf8), encoding: .utf8) ?? "[]"
  Database.shared.exec("INSERT INTO rows (tbl, id, fields) VALUES (?, ?, ?) ON CONFLICT (tbl, id) DO UPDATE SET fields = excluded.fields", [table, id, json])
}

public func dbAll(_ table: String) -> [Row] {
  Database.shared.query("SELECT id, fields FROM rows WHERE tbl = ? ORDER BY rowid DESC", [table]).map { r in
    let fields = (try? JSONSerialization.jsonObject(with: Data(r[1].utf8))) as? [String] ?? []
    return Row(id: r[0], fields: fields)
  }
}

public func dbDelete(_ table: String, _ id: String) {
  Database.shared.exec("DELETE FROM rows WHERE tbl = ? AND id = ?", [table, id])
}

public func dbClear(_ table: String) {
  Database.shared.exec("DELETE FROM rows WHERE tbl = ?", [table])
}

public func dbInfo() -> String {
  "SQLite \(String(cString: sqlite3_libversion())) · \(Database.shared.path)"
}
