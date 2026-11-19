// The renderer of ui.ns and store.ns for Android: the bodies of their `extern` declarations, over the
// Kotlin runtime of nuclo (runtime/android: Android Views, the system back, no JavaScript). The generated
// .kt files are in the same (root) package, so `Mod`, `Style`, `Attributes`, and `Row` are shared names.

import android.database.sqlite.SQLiteDatabase
import android.os.Build
import android.view.HapticFeedbackConstants
import dev.nuclo.runtime.A
import dev.nuclo.runtime.Align
import dev.nuclo.runtime.Display
import dev.nuclo.runtime.Easing
import dev.nuclo.runtime.FlexDirection
import dev.nuclo.runtime.FlexWrap
import dev.nuclo.runtime.FontStyle
import dev.nuclo.runtime.FontWeight
import dev.nuclo.runtime.Justify
import dev.nuclo.runtime.MediaRule
import dev.nuclo.runtime.NRoute
import dev.nuclo.runtime.NRouter
import dev.nuclo.runtime.NTab
import dev.nuclo.runtime.prefetchImage
import dev.nuclo.runtime.Node
import dev.nuclo.runtime.NodeMod
import dev.nuclo.runtime.ObjectFit
import dev.nuclo.runtime.Overflow
import dev.nuclo.runtime.PointerEvents
import dev.nuclo.runtime.Position
import dev.nuclo.runtime.Runtime
import dev.nuclo.runtime.StyleClass
import dev.nuclo.runtime.TextAlign
import dev.nuclo.runtime.TextDecoration
import dev.nuclo.runtime.TextTransform
import dev.nuclo.runtime.Style as NStyle
import nns.runtime.NList
import org.json.JSONArray

typealias View = NodeMod
typealias StyleResult = StyleClass

// ---- styles ------------------------------------------------------------------------------

private fun direction(v: String?) = when (v) { "row" -> FlexDirection.Row; "column" -> FlexDirection.Column; else -> null }

private fun align(v: String?) = when (v) {
  "flex-start", "start" -> Align.FlexStart
  "center" -> Align.Center
  "flex-end", "end" -> Align.FlexEnd
  "stretch" -> Align.Stretch
  else -> null
}

private fun display(v: String?) = when (v) { null -> null; "none" -> Display.None; else -> Display.Flex }

/** A state or a breakpoint: the keys of `Look`. */
private fun look(l: Look) = NStyle(
  backgroundColor = l.backgroundColor, color = l.color, borderColor = l.borderColor, opacity = l.opacity, scale = l.scale,
  flexDirection = direction(l.flexDirection), flex = l.flex, gap = l.gap, padding = l.padding,
  paddingLeft = l.px, paddingRight = l.px, paddingTop = l.py, paddingBottom = l.py,
  width = l.width, maxWidth = l.maxWidth, height = l.height, fontSize = l.fontSize, display = display(l.display),
)

/** nuclo-core's style object as the runtime's style. A string the runtime has no value for is left unset. */
fun css(s: Style): StyleResult = dev.nuclo.runtime.css(NStyle(
  flexDirection = direction(s.flexDirection),
  alignItems = align(s.alignItems),
  alignSelf = align(s.alignSelf),
  justifyContent = when (s.justifyContent) {
    "flex-start", "start" -> Justify.FlexStart
    "center" -> Justify.Center
    "flex-end", "end" -> Justify.FlexEnd
    "space-between" -> Justify.SpaceBetween
    "space-around" -> Justify.SpaceAround
    "space-evenly" -> Justify.SpaceEvenly
    else -> null
  },
  flexWrap = when (s.flexWrap) { "wrap" -> FlexWrap.Wrap; "nowrap" -> FlexWrap.Nowrap; else -> null },
  flex = s.flex, gap = s.gap,
  padding = s.padding, paddingLeft = s.pl ?: s.px, paddingRight = s.pr ?: s.px, paddingTop = s.pt ?: s.py, paddingBottom = s.pb ?: s.py,
  margin = s.margin, marginTop = s.mt ?: s.my, marginBottom = s.mb ?: s.my, marginLeft = s.ml ?: s.mx, marginRight = s.mr ?: s.mx,
  width = s.width, widthPct = s.widthPct, height = s.height, minWidth = s.minWidth, maxWidth = s.maxWidth,
  minHeight = s.minHeight, maxHeight = s.maxHeight, aspectRatio = s.aspectRatio,
  overflow = when (s.overflow) { "visible" -> Overflow.Visible; "hidden" -> Overflow.Hidden; "scroll" -> Overflow.Scroll; else -> null },
  position = when (s.position) { "absolute" -> Position.Absolute; "relative" -> Position.Relative; else -> null },
  top = s.top, right = s.right, bottom = s.bottom, left = s.left, zIndex = s.zIndex, display = display(s.display),
  backgroundColor = s.backgroundColor, color = s.color, opacity = s.opacity,
  borderRadius = s.borderRadius, borderWidth = s.borderWidth, borderColor = s.borderColor,
  borderTopWidth = s.borderTopWidth, borderBottomWidth = s.borderBottomWidth,
  shadowColor = s.shadowColor, shadowRadius = s.shadowRadius, shadowOffsetY = s.shadowOffsetY, shadowOffsetX = s.shadowRadius?.let { 0.0 },
  fontSize = s.fontSize,
  fontWeight = when (s.fontWeight) {
    "light", "300" -> FontWeight.Light
    "normal", "400" -> FontWeight.Normal
    "medium", "500" -> FontWeight.Medium
    "semibold", "600" -> FontWeight.Semibold
    "bold", "700" -> FontWeight.Bold
    else -> null
  },
  fontStyle = when (s.fontStyle) { "italic" -> FontStyle.Italic; "normal" -> FontStyle.Normal; else -> null },
  fontFamily = s.fontFamily, lineHeight = s.lineHeight, letterSpacing = s.letterSpacing,
  textAlign = when (s.textAlign) { "left" -> TextAlign.Left; "center" -> TextAlign.Center; "right" -> TextAlign.Right; else -> null },
  textDecoration = when (s.textDecoration) {
    "none" -> TextDecoration.None
    "underline" -> TextDecoration.Underline
    "line-through" -> TextDecoration.LineThrough
    else -> null
  },
  textTransform = when (s.textTransform) {
    "none" -> TextTransform.None
    "uppercase" -> TextTransform.Uppercase
    "lowercase" -> TextTransform.Lowercase
    "capitalize" -> TextTransform.Capitalize
    else -> null
  },
  numberOfLines = s.numberOfLines,
  objectFit = when (s.objectFit) { "contain" -> ObjectFit.Contain; "fill" -> ObjectFit.Fill; "cover" -> ObjectFit.Cover; else -> null },
  pointerEvents = when (s.pointerEvents) { "none" -> PointerEvents.None; "auto" -> PointerEvents.Auto; else -> null },
  translateX = s.translateX, translateY = s.translateY, scale = s.scale, rotate = s.rotate,
  transitionDuration = s.transition,
  transitionEasing = when (s.easing) {
    "linear" -> Easing.Linear
    "ease" -> Easing.Ease
    "ease-in" -> Easing.EaseIn
    "ease-out" -> Easing.EaseOut
    "ease-in-out" -> Easing.EaseInOut
    "spring" -> Easing.Spring
    else -> null
  },
  pressed = s.pressed?.let { look(it) },
  hover = s.hover?.let { look(it) },
  media = listOfNotNull(s.md?.let { MediaRule(720.0, null, look(it)) }, s.lg?.let { MediaRule(1080.0, null, look(it)) }).ifEmpty { null },
))

// ---- builders ------------------------------------------------------------------------------

private fun point(e: dev.nuclo.runtime.PointerEvent) = Point(e.x, e.y, e.pageX, e.pageY)

private fun attributes(a: Attributes): List<NodeMod> = listOfNotNull(
  a.className?.let { f -> A.className(f) },
  a.value?.let { f -> A.value(f) },
  a.checked?.let { f -> A.checked(f) },
  a.src?.let { A.src(it) },
  a.placeholder?.let { A.placeholder(it) },
  a.label?.let { A.ariaLabel(it) },
  a.inputType?.let { A.inputType(it) },
  a.onClick?.let { f -> A.onClick { f() } },
  a.onInput?.let { f -> A.onInput { f(it.target.value) } },
  a.onChange?.let { f -> A.onChange { f(it.target.checked) } },
  a.onKeyDown?.let { f -> A.onKeyDown { f(it.key) } },
  a.onPan?.let { f -> A.onPan { f(Pan(it.state, it.translationX, it.translationY, it.velocityX, it.velocityY, it.x, it.y)) } },
  a.onPinch?.let { f -> A.onPinch { f(Pinch(it.state, it.scale)) } },
  a.onLongPress?.let { f -> A.onLongPress { f(point(it)) } },
  a.onDoubleClick?.let { f -> A.onDoubleClick { f(point(it)) } },
  a.onPointerDown?.let { f -> A.onPointerDown { f(point(it)) } },
  a.onPointerUp?.let { f -> A.onPointerUp { f(point(it)) } },
  a.onScroll?.let { f -> A.onScroll { f(Scroll(it.scrollTop, it.scrollHeight, it.clientHeight)) } },
  a.onDestroy?.let { f -> A.onDestroy { f() } },
)

fun el(tag: String, mods: NList<Mod>): View {
  val m = mods.flatMap {
    when (it) {
      is Mod.Part -> listOf(it.v0)
      is Mod.Text -> listOf(A.text(it.v0))
      is Mod.TextOf -> listOf(A.text(it.v0))
      is Mod.Class -> listOf(it.v0)
      is Mod.ClassOf -> listOf(A.className(it.v0))
      is Mod.Attrs -> attributes(it.v0)
    }
  }.toTypedArray()
  return when (tag) {
    "button" -> dev.nuclo.runtime.button(*m)
    "input" -> dev.nuclo.runtime.input(*m)
    "textarea" -> dev.nuclo.runtime.textarea(*m)
    "img" -> dev.nuclo.runtime.img(*m)
    "checkbox" -> dev.nuclo.runtime.checkbox(*m)
    else -> dev.nuclo.runtime.el(tag, *m)
  }
}

// The runtime matches rows by `equals`: a record is a data class, so a changed item gets a new row.
// A row is a builder's node; a view that is not one (an attribute) gives no row.
fun <T> list(items: () -> NList<T>, render: (T, Int) -> View): View =
  dev.nuclo.runtime.list(items) { item, i -> render(item, i) as? Node }

/** A `when` branch is made each time it opens. */
fun when_(cond: () -> Boolean, show: () -> View): View = dev.nuclo.runtime.`when`(cond) { listOf(show()) }

fun update() {
  dev.nuclo.runtime.update()
}

// ---- navigation ------------------------------------------------------------------------------

class Route(val pattern: String, val title: (String) -> String, val view: (String) -> View, val kind: String)

fun route(pattern: String, title: (String) -> String, view: (String) -> View, kind: String) = Route(pattern, title, view, kind)

private var router: NRouter? = null

fun navigate(routes: NList<Route>, tabs: NList<Tab>) {
  val r = NRouter(
    routes.map { r ->
      NRoute(
        r.pattern,
        { params -> r.view(params["id"] ?: "") as Node },
        { params -> r.title(params["id"] ?: "") },
        if (r.kind == "modal" || r.kind == "full") r.kind else "push",
        r.kind == "push",
      )
    },
    tabs.map { NTab(it.path, it.title, it.icon) },
  )
  router = r
  dev.nuclo.runtime.render(r)
}

fun go(path: String) { router?.go(path) }
fun back() { router?.back() }
fun reset(path: String) { router?.reset(path) }

fun overlay(view: () -> View) {
  dev.nuclo.runtime.render { view() as Node }
}

// ---- the platform's own components: Material 3 -------------------------------------------------

private fun native(actions: NList<Action>) = actions.map { dev.nuclo.runtime.NativeAction(it.label, it.kind) { it.run() } }

fun nativeAlert(title: String, message: String, actions: NList<Action>): Boolean {
  dev.nuclo.runtime.NativeUi.alert(title, message, native(actions))
  return true
}

fun nativeActions(title: String, actions: NList<Action>): Boolean {
  dev.nuclo.runtime.NativeUi.actions(title, native(actions))
  return true
}

fun nativeMenu(x: Double, y: Double, title: String, actions: NList<Action>): Boolean {
  dev.nuclo.runtime.NativeUi.menu(x, y, title, native(actions))
  return true
}

fun nativeSheet(title: String, detent: String, content: () -> View): Boolean {
  dev.nuclo.runtime.NativeUi.sheet(title, detent, content() as Node)
  return true
}

fun hasControl(kind: String): Boolean = kind == "segmented" || kind == "chip" || kind == "slider"

fun segmentedControl(options: NList<String>, at: () -> Int, pick: (Int) -> Unit): View =
  dev.nuclo.runtime.NativeControls.segmented(options.toList(), at, pick)

fun chipControl(label: String, on: () -> Boolean, pick: () -> Unit): View = dev.nuclo.runtime.NativeControls.chip(label, on, pick)

fun sliderControl(value: () -> Double, color: String, change: (Double) -> Unit): View = dev.nuclo.runtime.NativeControls.slider(value, color, change)

fun nativeCloseSheet(): Boolean = dev.nuclo.runtime.NativeUi.closeSheet()

fun nativeToast(text: String): Boolean {
  dev.nuclo.runtime.NativeUi.toast(text)
  return true
}

// ---- platform ---------------------------------------------------------------------------------

fun later(ms: Int, f: () -> Unit) {
  Runtime.main.postDelayed({ f() }, ms.toLong())
}

fun prefetch(url: String) = prefetchImage(url)

fun haptic(kind: String) {
  val v = Runtime.activity.window.decorView
  v.performHapticFeedback(
    when (kind) {
      "success" -> if (Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.LONG_PRESS
      "medium" -> HapticFeedbackConstants.LONG_PRESS
      else -> if (Build.VERSION.SDK_INT >= 27) HapticFeedbackConstants.KEYBOARD_TAP else HapticFeedbackConstants.VIRTUAL_KEY
    },
  )
}

fun platform() = "android"

fun viewport(): Viewport {
  val m = Runtime.activity.resources.displayMetrics
  val root = Runtime.activity.window.decorView
  val w = if (root.width > 0) root.width else m.widthPixels
  val h = if (root.height > 0) root.height else m.heightPixels
  return Viewport(w / m.density.toDouble(), h / m.density.toDouble())
}

fun theme(dark: Boolean, accent: String, background: String) = dev.nuclo.runtime.chromeTheme(dark, accent, background)

// ---- storage: SQLite (android.database.sqlite, part of the platform) ---------------------------

private val db: SQLiteDatabase by lazy {
  Runtime.activity.openOrCreateDatabase("nuclo-native-ns.db", android.content.Context.MODE_PRIVATE, null).apply {
    execSQL("CREATE TABLE IF NOT EXISTS rows (tbl TEXT NOT NULL, id TEXT NOT NULL, fields TEXT NOT NULL, PRIMARY KEY (tbl, id))")
  }
}

fun dbPut(table: String, id: String, fields: NList<String>) {
  val json = JSONArray(fields.toList()).toString()
  db.execSQL(
    "INSERT INTO rows (tbl, id, fields) VALUES (?, ?, ?) ON CONFLICT (tbl, id) DO UPDATE SET fields = excluded.fields",
    arrayOf(table, id, json),
  )
}

fun dbAll(table: String): NList<Row> {
  val out = NList<Row>()
  db.rawQuery("SELECT id, fields FROM rows WHERE tbl = ? ORDER BY rowid DESC", arrayOf(table)).use { c ->
    while (c.moveToNext()) {
      val arr = JSONArray(c.getString(1))
      val fields = NList<String>()
      for (i in 0 until arr.length()) fields.add(arr.getString(i))
      out.add(Row(c.getString(0), fields))
    }
  }
  return out
}

fun dbDelete(table: String, id: String) {
  db.delete("rows", "tbl = ? AND id = ?", arrayOf(table, id))
}

fun dbClear(table: String) {
  db.delete("rows", "tbl = ?", arrayOf(table))
}

fun dbInfo(): String {
  val version = db.rawQuery("SELECT sqlite_version()", null).use { c -> if (c.moveToFirst()) c.getString(0) else "?" }
  return "SQLite $version · ${db.path}"
}

