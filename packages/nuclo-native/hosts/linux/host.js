// nuclo-native host for Linux: GTK 4 + libadwaita widgets driven from GJS.
// JS lays everything out (src/layout.ts): this host places widgets at the frames it sends,
// measures text and draws it itself (Pango, the bundled Inter) at the contract's baselines.
// Run: gjs -m hosts/linux/host.js dist/app.js
// NUCLO_SELFTEST=1 (or =out.png): saves the window (out.png) and the first screen's whole content
// (out-content.png) as launched, presses "Run check" if the app has one, prints the result, and quits.
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import Gsk from "gi://Gsk";
import Graphene from "gi://Graphene";
import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Pango from "gi://Pango";
import PangoCairo from "gi://PangoCairo";
import { programArgs } from "system";

const { HORIZONTAL, VERTICAL } = Gtk.Orientation;
// The router's tab icon names → Adwaita symbolic icons.
const ICONS = { chart: "x-office-presentation-symbolic", photo: "image-x-generic-symbolic", person: "avatar-default-symbolic" };

const bundle = programArgs[0] ?? "dist/app.js";
const fontFiles = ["Inter-Regular.ttf", "Inter-Bold.ttf"].map((f) => GLib.build_filenamev([GLib.path_get_dirname(bundle), "fonts", f]));
// Pango < 1.56 cannot add font files: point fontconfig at a config that adds the bundle's fonts first.
if (!Pango.FontMap.prototype.add_font_file) {
  const conf = GLib.build_filenamev([GLib.get_tmp_dir(), "nuclo-fonts.conf"]);
  const dir = GLib.path_get_dirname(fontFiles[0]);
  GLib.file_set_contents(conf, `<?xml version="1.0"?><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${dir}</dir></fontconfig>`);
  GLib.setenv("FONTCONFIG_FILE", conf, true);
}

const widgets = new Map();
/** Stacks whose screens changed in the current batch. */
const dirty = new Set();
/** Every screen's background: the body's backgroundColor. */
const screenCss = new Gtk.CssProvider();
/** Controls fitted into contract boxes (layout.ts): no minimum sizes; an input's text 8 in. */
const controlCss = new Gtk.CssProvider();
controlCss.load_from_string(`
button.nuclo { min-height: 0; min-width: 0; padding: 0; border: none; }
entry.nuclo { min-height: 0; padding: 0 8px; font-family: Inter; font-size: 14px; }`);
/** True while a batch is applied: navigation changes then are the app's, not the user's. */
let applying = false;
/** Inside a size_allocate: resizes queued now would be lost, so they wait for the next idle. */
let allocating = 0;
/** A frame op arrived: the batch's end snaps the frames to device pixels. */
let placed = false;
let window;

const emit = (id, type, value) => globalThis.__nuclo_event(id, type, value);
const later = (fn) => (allocating ? GLib.idle_add(GLib.PRIORITY_HIGH_IDLE, () => void fn()) : fn());
/** Device pixels per logical pixel. */
const deviceScale = () => window?.get_surface()?.get_scale?.() ?? window?.get_scale_factor() ?? 1;

function rgba(value) {
  const color = new Gdk.RGBA();
  color.parse(value);
  return color;
}

// ── Text, the contract's way (layout.ts): Inter, line height 1.35 × size ─────────

/** The font map Inter is registered in: the default one, or a fontconfig one where the default takes no files (CoreText on macOS). */
const interMap = (() => {
  const maps = [() => PangoCairo.FontMap.get_default(), () => PangoCairo.FontMap.new_for_font_type(1 /* CAIRO_FONT_TYPE_FT */)];
  for (const map of maps) {
    try {
      const m = map();
      if (fontFiles.every((file) => m.add_font_file(file))) return m;
    } catch {
      // Not this map.
    }
  }
  return PangoCairo.FontMap.get_default(); // registered through fontconfig (above), or missing
})();
// Glyph positions stay fractional, as the browser lays text out.
const contextOf = (map) => {
  const context = map.create_context();
  context.set_round_glyph_positions(false);
  return context;
};
const contexts = { inter: contextOf(interMap), system: contextOf(PangoCairo.FontMap.get_default()) };
/** Inter's ascent and descent (its hhea values), in em. */
const INTER = { ascent: 0.96875, descent: 0.2412109375 };

/** A font spec: { size, bold, system } → its Pango description, context and em metrics. */
function resolve(font) {
  const desc = Pango.FontDescription.from_string(font.system ? Gtk.Settings.get_default().gtk_font_name : "Inter");
  desc.set_absolute_size(font.size * Pango.SCALE);
  desc.set_weight(font.bold ? Pango.Weight.BOLD : Pango.Weight.NORMAL);
  const context = font.system ? contexts.system : contexts.inter;
  let em = INTER;
  if (font.system) {
    const metrics = context.get_metrics(desc, null);
    em = { ascent: metrics.get_ascent() / Pango.SCALE / font.size, descent: metrics.get_descent() / Pango.SCALE / font.size };
  }
  return { ...font, desc, context, em };
}

const defaultFont = () => resolve({ size: 14, bold: false, system: false });

/** A line's height: 1.35 × the font size on the browser's 1/64 device-pixel grid (layout.ts lineHeight). */
const lineHeight = (size, scale) => Math.floor(size * 1.35 * scale * 64 + 1e-6) / (scale * 64);

/** Where the browser puts the baseline in a line: ascent and descent rounded to device pixels, half the leading above, floored. */
function baseline(font, scale) {
  const ascent = Math.round(font.em.ascent * font.size * scale);
  const descent = Math.round(font.em.descent * font.size * scale);
  return (ascent + Math.floor((lineHeight(font.size, scale) * scale - ascent - descent) / 2)) / scale;
}

const utf8 = new TextEncoder();
const fromUtf8 = new TextDecoder();

/** A text broken into lines as it is drawn: Pango wraps at `maxWidth` (< 0: only at newlines); each line, trailing spaces dropped, is its own layout. */
function typeset(text, font, maxWidth) {
  if (!text) return [];
  const single = (part) => {
    const layout = Pango.Layout.new(font.context);
    layout.set_font_description(font.desc);
    layout.set_text(part, -1);
    return layout;
  };
  const whole = single(text);
  whole.set_wrap(Pango.WrapMode.WORD);
  whole.set_width(maxWidth < 0 ? -1 : Math.floor(maxWidth * Pango.SCALE));
  const bytes = utf8.encode(text);
  const lines = [];
  for (let i = 0; i < whole.get_line_count(); i++) {
    const line = whole.get_line_readonly(i);
    const layout = single(fromUtf8.decode(bytes.subarray(line.start_index, line.start_index + line.length)).replace(/\s+$/, ""));
    lines.push({ layout, width: layout.get_extents()[1].width / Pango.SCALE });
  }
  return lines;
}

/** Widths round up to 1/100, so the box JS sends back always fits the text. */
function textSize(text, font, maxWidth) {
  const lines = typeset(text, font, maxWidth);
  const width = Math.ceil(Math.max(0, ...lines.map((l) => l.width)) * 100 - 0.001) / 100;
  return `${width} ${lines.length * lineHeight(font.size, deviceScale())}`;
}

// ── Views ─────────────────────────────────────────────────────────────────

/**
 * Every nuclo view: a container (children at the frames JS sent), a text, an image, or a button's label.
 * It paints itself: background, the text line by line at the contract's baselines, the image (cover), all
 * inside its rounded corners, which clip its children too. GTK sizes are whole logical pixels, so it paints
 * its snapped frame (_frame), not its allocation.
 */
const View = GObject.registerClass(
  class NucloView extends Gtk.Widget {
    vfunc_measure(orientation) {
      // A screen's content is as tall as its layout (the frame op); the rest takes what its parent gives.
      const size = orientation === VERTICAL ? (this._content?.[1] ?? 0) : 0;
      return [size, size, -1, -1];
    }

    vfunc_size_allocate(width, height) {
      allocating++;
      try {
        this._resized?.(width, height);
        for (let c = this.get_first_child(); c; c = c.get_next_sibling()) place(c);
      } finally {
        allocating--;
      }
    }

    vfunc_snapshot(snapshot) {
      const [w, h] = this._frame?.slice(2) ?? [this.get_width(), this.get_height()];
      const rect = new Graphene.Rect().init(0, 0, w, h);
      const clip = this._radius || this._texture;
      if (clip) snapshot.push_rounded_clip(new Gsk.RoundedRect().init_from_rect(rect, this._radius ?? 0));
      if (this._background) snapshot.append_color(this._background, rect);
      if (this._texture) {
        // Cover: scaled to fill, centred, cropped.
        const t = this._texture;
        const scale = Math.max(w / t.width, h / t.height);
        snapshot.append_texture(t, new Graphene.Rect().init((w - t.width * scale) / 2, (h - t.height * scale) / 2, t.width * scale, t.height * scale));
      }
      if (this._text) drawText(this, snapshot);
      for (let c = this.get_first_child(); c; c = c.get_next_sibling()) this.snapshot_child(c, snapshot);
      if (clip) snapshot.pop();
    }
  },
);

/** Places a child at its snapped frame. Controls get at least their minimum size, centred on the frame. */
function place(child) {
  const [x, y, w, h] = child._frame ?? [0, 0, 0, 0];
  const [minW] = child.measure(HORIZONTAL, -1);
  const [minH] = child.measure(VERTICAL, -1);
  const aw = Math.max(minW, Math.round(w));
  const ah = Math.max(minH, Math.round(h));
  const at = new Graphene.Point({ x: aw > Math.round(w) ? x + (w - aw) / 2 : x, y: ah > Math.round(h) ? y + (h - ah) / 2 : y });
  child.allocate(aw, ah, -1, Gsk.Transform.new().translate(at));
}

/** A text's lines, kept while its text, font and width stay the same. */
function linesOf(view, width) {
  const key = `${width}`;
  if (view._typeset?.key !== key) view._typeset = { key, lines: typeset(view._text, view._font, width) };
  return view._typeset.lines;
}

/** Draws a text in its box from where JS put it (the frame is snapped, the text is not), each baseline on a device pixel. */
function drawText(view, snapshot) {
  const owner = view._owner ?? view; // a button's label lays out in the button's box
  if (!owner._layout) return;
  const [, origin] = view.compute_point(owner, new Graphene.Point({ x: 0, y: 0 }));
  const [ox, oy] = owner._offset ?? [0, 0];
  const [padX, padY] = view._pad;
  const box = [padX + ox - (origin?.x ?? 0), padY + oy - (origin?.y ?? 0), owner._layout[2] - 2 * padX];
  const scale = deviceScale();
  const font = view._font;
  const line = lineHeight(font.size, scale);
  const first = baseline(font, scale);
  const color = view._color ?? rgba(Adw.StyleManager.get_default().dark ? "#fff" : "#000");
  linesOf(view, box[2] + 0.01).forEach(({ layout, width }, i) => {
    const slack = box[2] - width;
    const x = box[0] + (view._align === "center" ? slack / 2 : view._align === "right" ? slack : 0);
    const y = Math.round((box[1] + i * line + first) * scale) / scale - layout.get_baseline() / Pango.SCALE;
    snapshot.save();
    snapshot.translate(new Graphene.Point({ x, y }));
    snapshot.append_layout(layout, color);
    snapshot.restore();
  });
}

function textView(pad = [0, 0], align = "left") {
  const view = new View();
  Object.assign(view, { _text: "", _font: defaultFont(), _pad: pad, _align: align });
  return view;
}

/** Places views at their frames with edges on device pixels, as the browser paints boxes: each edge
 * rounds from its unsnapped position on screen, so boxes never blur or gap. Texts keep the unsnapped offset. */
function snapFrames() {
  placed = false;
  const scale = deviceScale();
  const snap = (v) => Math.round(v * scale) / scale;
  const walk = (parent, ox, oy, sx, sy) => {
    for (let c = parent.get_first_child(); c; c = c.get_next_sibling()) {
      if (!c._layout) continue;
      const [fx, fy, fw, fh] = c._layout;
      const x = ox + fx, y = oy + fy;
      const ex = snap(x), ey = snap(y);
      const frame = [ex - sx, ey - sy, snap(x + fw) - ex, snap(y + fh) - ey];
      const offset = [x - ex, y - ey];
      if (!c._frame || frame.some((v, i) => v !== c._frame[i])) {
        c._frame = frame;
        parent.queue_allocate();
        c.queue_draw();
      }
      if (!c._offset || offset.some((v, i) => v !== c._offset[i])) {
        c._offset = offset;
        (c._label ?? c).queue_draw();
      }
      if (c instanceof View) walk(c, x, y, ex, ey);
    }
  };
  for (const root of roots()) walk(root, 0, 0, 0, 0);
}

/** The layout roots: the body, and each screen's content. */
function* roots() {
  for (const widget of widgets.values()) if (widget._id === 1 || widget._box) yield widget._box ?? widget;
}

/** __nuclo_device("frames"): every view's frame as placed, relative to its parent; layout roots are their own origin (check.ts). */
function framesJSON() {
  const frames = {};
  for (const [id, widget] of widgets) {
    const content = widget._box?._content;
    const frame = id === 1 ? [0, 0, widget.get_width(), widget.get_height()] : widget._box ? content && [0, 0, ...content] : widget._frame;
    if (frame) frames[id] = frame.map((v) => Math.round(v * 100) / 100);
  }
  return JSON.stringify(frames);
}

const create = {
  view: () => new View(),
  text: () => textView(),
  image: () => new View(),
  // The button fills its frame; its label is a text view, so what is measured is what is drawn.
  button: () => {
    const label = textView([16, 8], "center");
    const button = new Gtk.Button({ child: label, css_classes: ["nuclo"] });
    label._owner = button;
    button._label = label;
    return button;
  },
  input: () => {
    const entry = new Gtk.Entry({ css_classes: ["nuclo"] });
    entry.set_font_map(interMap);
    return entry;
  },
  // The toolkit's checkbox, centred in its 24 × 24 box.
  checkbox: () => new Gtk.CheckButton({ halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER }),

  // One page per stack, switched from a bottom bar.
  tabs: () => {
    const views = new Adw.ViewStack();
    const tabs = new Adw.ToolbarView({ content: views });
    tabs.add_bottom_bar(new Adw.ViewSwitcherBar({ stack: views, reveal: true }));
    tabs._views = views;
    tabs._tabs = [];
    views.connect("notify::visible-child", () => {
      if (!applying) emit(tabs._id, "select", tabs._tabs.indexOf(views.visible_child));
    });
    return tabs;
  },

  // Push/pop transitions, back button, swipe back, Alt+Left and mouse back are built in.
  stack: () => {
    const nav = new Adw.NavigationView();
    nav._pages = []; // the app's screens, bottom to top
    nav.connect("popped", () => {
      if (applying) return;
      // The user went back: the screens JS removes next are already gone.
      nav._pages = pagesOf(nav);
      emit(nav._id, "pop", nav._pages.length);
    });
    return nav;
  },

  // A screen is a layout root: JS lays its content out at the screen's width, and it scrolls.
  screen: () => {
    const box = new View();
    const scroll = new Gtk.ScrolledWindow({ child: box, css_classes: ["nuclo-screen"], hscrollbar_policy: Gtk.PolicyType.NEVER });
    const content = new Adw.ToolbarView({ content: scroll });
    content.add_top_bar(new Adw.HeaderBar());
    const page = new Adw.NavigationPage({ child: content });
    page._box = box;
    box._resized = (width) => {
      if (width === box._width) return;
      box._width = width;
      emit(page._id, "resize", `${width} ${scroll.get_height()} ${deviceScale()}`);
    };
    // JS loads more as the end comes near (dom.ts, "end"). A shrinking page moves it mid-allocate.
    const adjustment = scroll.get_vadjustment();
    adjustment.connect("value-changed", () =>
      later(() => emit(page._id, "scroll", `${adjustment.get_value()} ${adjustment.get_page_size()}`)),
    );
    return page;
  },
};

function pagesOf(nav) {
  const stack = nav.navigation_stack;
  return Array.from({ length: stack.get_n_items() }, (_, i) => stack.get_item(i));
}

const same = (a, b) => a.length === b.length && a.every((page, i) => page === b[i]);

// Shows a stack's screens: a new top is a push, a removed top a pop (both animated), anything else a replace.
function sync(nav) {
  const want = nav._pages;
  const shown = pagesOf(nav);
  const top = want.at(-1);
  if (same(want, shown)) return;
  if (shown.length && same(want.slice(0, -1), shown)) nav.push(top);
  else if (top && same(want, shown.slice(0, want.length))) nav.pop_to_page(top);
  else nav.replace(want);
}

function select(tabs) {
  const nav = tabs._tabs[tabs._selected ?? 0];
  if (nav) tabs._views.visible_child = nav;
}

/** Drops a removed subtree; views let go of their children themselves (GJS can't run a dispose vfunc during GC). */
function forget(widget) {
  for (let c = widget.get_first_child(), next; c; c = next) {
    next = c.get_next_sibling();
    forget(c);
    if (widget instanceof View) c.unparent();
  }
  widgets.delete(widget._id);
}

/** A control's own CSS (buttons and inputs: GTK draws them). */
function css(widget, name, value) {
  const rules = (widget._css ??= {});
  rules[name] = value;
  if (!widget._provider) {
    widget._provider = new Gtk.CssProvider();
    widget.get_style_context().add_provider(widget._provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1);
  }
  widget._provider.load_from_string(`* {${Object.entries(rules).map(([k, v]) => `${k}:${v};`).join("")}}`);
}

const apply = {
  create(id, kind) {
    const widget = create[kind]();
    widget._id = id;
    widgets.set(id, widget);
  },

  insert(parentId, id, beforeId) {
    const parent = widgets.get(parentId);
    const child = widgets.get(id);
    if (parent._pages) {
      // A screen onto a stack: only the model changes now, the batch's end shows it.
      const pages = parent._pages.filter((page) => page !== child);
      const at = beforeId ? pages.indexOf(widgets.get(beforeId)) : -1;
      pages.splice(at < 0 ? pages.length : at, 0, child);
      parent._pages = pages;
      child._nav = parent;
      dirty.add(parent);
    } else if (parent._tabs) {
      // ponytail: tabs only append; the router never reorders them, use beforeId if one does.
      child._tab = parent._views.add_titled_with_icon(child, null, child._title ?? "", child._icon ?? "");
      parent._tabs.push(child);
      select(parent);
    } else if (parentId === 1 && (child._pages || child._tabs)) {
      window.content = child;
    } else {
      const box = parent._box ?? parent;
      if (child.get_parent()) child.unparent();
      child.insert_before(box, beforeId ? widgets.get(beforeId) : null);
    }
  },

  remove(id) {
    const widget = widgets.get(id);
    if (widget._nav) {
      // A no-op when the user already went back natively.
      widget._nav._pages = widget._nav._pages.filter((page) => page !== widget);
      dirty.add(widget._nav);
    } else if (widget.get_parent()) widget.unparent();
    forget(widget);
  },

  set(id, key, value) {
    const widget = widgets.get(id);
    if (key === "text") {
      const text = widget._label ?? widget;
      if (text instanceof View) {
        text._text = value ?? "";
        text._typeset = null;
        text.queue_draw();
      }
    } else if (key === "value") {
      if (widget.text !== value) widget.text = value ?? "";
    } else if (key === "checked") widget.active = !!value;
    else if (key === "placeholder") widget.placeholder_text = value;
    else if (key === "type") widget.visibility = value !== "password";
    else if (key === "disabled") widget.sensitive = !value;
    else if (key === "title" && widget instanceof Adw.NavigationPage) widget.title = value ?? "";
    else if (key === "title" || key === "icon") {
      // A stack's tab.
      widget["_" + key] = key === "icon" ? (ICONS[value] ?? value) : value;
      if (widget._tab) Object.assign(widget._tab, { title: widget._title ?? "", icon_name: widget._icon ?? "" });
    } else if (key === "selected" && widget._tabs) {
      widget._selected = Number(value);
      select(widget);
    } else if (key === "src") {
      // Asset paths are relative to the bundle.
      widget._texture = Gdk.Texture.new_from_filename(GLib.build_filenamev([GLib.path_get_dirname(bundle), value]));
      widget.queue_draw();
    }
  },

  /** Paint and text styles. Layout styles (flexDirection, gap, alignItems, flex, width, height) are JS's: they arrive as frames. */
  style(id, key, value) {
    const widget = widgets.get(id);
    const text = widget._label ?? widget; // a button's label holds its font and colour
    const own = widget instanceof View;
    if (id === 1 && key === "backgroundColor") screenCss.load_from_string(`.nuclo-screen{background-color:${value};}`);
    const n = parseFloat(value);
    switch (key) {
      case "backgroundColor":
        if (own) widget._background = rgba(value);
        else css(widget, "background", value);
        break;
      case "borderRadius":
        if (own) widget._radius = n;
        else css(widget, "border-radius", `${n}px`);
        break;
      case "opacity":
        widget.opacity = n;
        break;
      case "padding":
        // Only texts draw inset; an input keeps its text `padding` in.
        if (text instanceof View) text._pad = [n, n];
        else if (widget instanceof Gtk.Entry) css(widget, "padding", `0 ${n}px`);
        break;
      case "textAlign":
        text._align = value;
        break;
      case "color":
        if (text instanceof View) text._color = rgba(value);
        else css(widget, "color", value);
        break;
      case "fontSize":
      case "fontWeight":
      case "fontFamily": {
        const spec = (widget._spec ??= { size: 14, bold: false, system: false });
        if (key === "fontSize") spec.size = n;
        else if (key === "fontWeight") spec.bold = value === "bold" || n >= 600;
        else spec.system = value === "system";
        if (text instanceof View) {
          text._font = resolve(spec);
          text._typeset = null;
        } else if (widget instanceof Gtk.Entry) {
          widget.set_font_map(spec.system ? null : interMap);
          css(widget, "font-size", `${spec.size}px`);
          css(widget, "font-weight", spec.bold ? "700" : "400");
          css(widget, "font-family", spec.system ? "initial" : "Inter");
        }
        break;
      }
      default:
        return;
    }
    text.queue_draw();
    widget.queue_draw();
  },

  frame(id, x, y, w, h) {
    const widget = widgets.get(id);
    if (widget._box) {
      // A screen: its content scrolls to the laid-out height.
      widget._box._content = [w, h];
      later(() => widget._box.queue_resize());
    } else if (id !== 1) {
      widget._layout = [x, y, w, h];
      placed = true;
    }
  },

  listen(id, type) {
    const widget = widgets.get(id);
    if (type === "input") widget.connect("changed", () => emit(id, type, widget.text));
    else if (type === "change") {
      if (widget instanceof Gtk.CheckButton) widget.connect("toggled", () => emit(id, type, widget.active));
      else widget.connect("activate", () => emit(id, type));
    } else if (type === "click") {
      if (widget instanceof Gtk.Button) widget.connect("clicked", () => emit(id, type));
      else {
        const gesture = new Gtk.GestureClick();
        gesture.connect("released", () => emit(id, type));
        widget.add_controller(gesture);
      }
    }
  },
};

/** __nuclo_measure: a leaf's content size (layout.ts adds the padding). */
globalThis.__nuclo_measure = (id, maxWidth) => {
  const widget = widgets.get(id);
  const text = widget?._label ?? widget;
  if (widget?._texture) return `${widget._texture.width} ${widget._texture.height}`;
  if (text instanceof View && text._font) return textSize(text._text, text._font, maxWidth);
  return "0 0";
};

/** Device data JS watches (src/device.ts): name → its last JSON, "" when the device has none. */
const devices = new Map();

globalThis.__nuclo_device = (name) => {
  if (name === "frames") return framesJSON();
  if (!devices.has(name)) {
    devices.set(name, "");
    try {
      if (name === "battery") watchBattery();
    } catch {
      // No system bus (macOS) or no UPower: no battery.
    }
  }
  return devices.get(name);
};

function changed(name, json) {
  if (devices.get(name) === json) return;
  devices.set(name, json);
  globalThis.__nuclo_device_changed(name, json);
}

// UPower's display device: the battery the desktop's panel shows. Module-level so GC never drops the proxy (and its signal).
let upower;
function watchBattery() {
  upower = Gio.DBusProxy.new_for_bus_sync(Gio.BusType.SYSTEM, Gio.DBusProxyFlags.NONE, null,
    "org.freedesktop.UPower", "/org/freedesktop/UPower/devices/DisplayDevice", "org.freedesktop.UPower.Device", null);
  const read = () => {
    const get = (key) => upower.get_cached_property(key)?.unpack();
    if (!get("IsPresent")) return "";
    const percent = get("Percentage");
    // 3 empty counts as discharging; 5/6 pending charge/discharge (plugged in, idle) as unknown.
    const state = { 1: "charging", 2: "discharging", 3: "discharging", 4: "full" }[get("State")] ?? "unknown";
    const seconds = { charging: get("TimeToFull"), discharging: get("TimeToEmpty") }[state]; // 0: unknown
    return JSON.stringify({ level: percent == null ? null : percent / 100, state, minutes: seconds ? Math.round(seconds / 60) : null });
  };
  devices.set("battery", read());
  upower.connect("g-properties-changed", () => changed("battery", read()));
}

/** NUCLO_SELFTEST: saves PNGs (as laid out at launch), runs examples/styles' check, prints it, quits. */
function selftest(out) {
  if (out.endsWith(".png")) {
    const scale = deviceScale();
    const save = (widget, path, background) => {
      const [w, h] = [widget.get_width(), widget.get_height()];
      const snapshot = new Gtk.Snapshot();
      snapshot.scale(scale, scale);
      if (background) snapshot.append_color(rgba(background), new Graphene.Rect().init(0, 0, w, h));
      new Gtk.WidgetPaintable({ widget }).snapshot(snapshot, w, h);
      const area = new Graphene.Rect().init(0, 0, w * scale, h * scale);
      window.get_renderer().render_texture(snapshot.to_node(), area).save_to_png(path);
      print(`selftest: saved ${path} (${w}×${h} at ${scale}×)`);
    };
    save(window, out);
    const content = [...roots()].find((root) => root !== widgets.get(1)) ?? widgets.get(1);
    save(content, out.replace(/\.png$/, "-content.png"), "#fff");
  }
  const button = [...widgets.values()].find((w) => w._label?._text === "Run check");
  if (button) {
    button.emit("clicked");
    for (const w of widgets.values()) if (w._text && (/boxes match/.test(w._text) || w._text.startsWith("#"))) print(w._text);
  } else print("selftest: no Run check button");
  window.application.quit();
}

const app = new Adw.Application({ application_id: "dev.nuclo.native" });
app.connect("activate", () => {
  // The body: without the router it is the layout root, at the window's content size.
  const root = new View();
  root._id = 1;
  widgets.set(1, root);
  root._resized = (width, height) => {
    if (width === root._width && height === root._height) return;
    Object.assign(root, { _width: width, _height: height });
    emit(1, "resize", `${width} ${height} ${deviceScale()}`);
  };
  // A tabs or stack inserted into the body replaces this content.
  const content = new Adw.ToolbarView({ content: root });
  content.add_top_bar(new Adw.HeaderBar());
  window = new Adw.ApplicationWindow({ application: app, title: "nuclo-native", default_width: 420, default_height: 640, content });
  for (const provider of [screenCss, controlCss]) {
    Gtk.StyleContext.add_provider_for_display(window.get_display(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
  }
  // Texts default to black, white in dark mode.
  Adw.StyleManager.get_default().connect("notify::dark", () => widgets.forEach((w) => (w._label ?? w).queue_draw?.()));

  globalThis.__nuclo_host = (json) => {
    const outer = applying;
    applying = true;
    try {
      for (const [op, ...args] of JSON.parse(json)) apply[op](...args);
      if (placed) snapFrames();
      for (const nav of dirty) sync(nav);
    } finally {
      dirty.clear();
      applying = outer;
    }
  };
  const [, bytes] = GLib.file_get_contents(bundle);
  (0, eval)(new TextDecoder().decode(bytes));
  window.present();
  const selftestOut = GLib.getenv("NUCLO_SELFTEST");
  if (selftestOut) GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => void selftest(selftestOut));
});
app.run([]);
