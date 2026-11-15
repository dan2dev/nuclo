// NucloRuntime.swift — the iOS runtime for apps compiled by nuclo-native-ts. UIKit only, no dependencies.
//
// The model is nuclo's: builders create native views once; `update()` re-runs the dynamic values
// (each dirty-checked against its last value before a view is touched) and reconciles list(),
// when() and region() in place. There is no virtual DOM and no JavaScript.
//
//   Node        one view (or a fragment: list/when/region/into, which owns no view)
//   FlexView    the container view: a flex column or row laid out by `Flex` (same algorithm on every target)
//   Touch       pointers and gestures of a view: pan, pinch, long press, double tap
//   Runtime     roots, update(), regions, the window
//   NRouter     tabs and navigation stacks on UITabBarController + UINavigationController, sheets for modals
//
// Requires iOS 15 (URLSession async, UIAction). Swift 5.9+.

import UIKit
import UIKit.UIGestureRecognizerSubclass

// MARK: - Types the generated code uses

public typealias Params = [String: String]
public typealias NativeElement = UIView
public typealias Content = @MainActor () -> [NodeMod?]
public typealias Cleanup = @MainActor () -> Void

/// Anything a builder accepts: a child node, text, an attribute, a style class, a fragment.
@MainActor public protocol NodeMod {
    func apply(to node: Node)
}

public struct InputTarget {
    public let value: String
    public let checked: Bool
}

public struct NativeEvent {
    public let target: InputTarget
}

/// Coordinates in points: `x`/`y` from the view's top-left corner, `pageX`/`pageY` from the window's.
public struct PointerEvent {
    public let x: Double
    public let y: Double
    public let pageX: Double
    public let pageY: Double
    public let pointerId: Int
}

public struct PanEvent {
    public let state: String
    public let translationX: Double
    public let translationY: Double
    public let velocityX: Double
    public let velocityY: Double
    public let x: Double
    public let y: Double
}

public struct PinchEvent {
    public let state: String
    public let scale: Double
    public let focalX: Double
    public let focalY: Double
}

public struct ScrollEvent {
    public let scrollTop: Double
    public let scrollLeft: Double
    public let scrollHeight: Double
    public let scrollWidth: Double
    public let clientHeight: Double
    public let clientWidth: Double
}

public struct KeyboardEvent {
    public let key: String
}

/// A view written for iOS, used from the app as `native<P>("Name")`: a class `Name` in native/ios/
/// implements this with `Props` the class the compiler generated from `P`.
@MainActor public protocol NativeComponent {
    associatedtype Props
    func create() -> UIView
    /// Runs after `create`, and whenever a dynamic prop changed.
    func update(_ view: UIView, _ props: Props)
    func destroy(_ view: UIView)
}

public extension NativeComponent {
    func destroy(_ view: UIView) {}
}

public struct NError: Error, LocalizedError {
    public let message: String
    public init(_ message: String) { self.message = message }
    public var errorDescription: String? { message }
}

// MARK: - Style

public enum FlexDirection: Equatable { case row, column }
public enum Align: Equatable { case flexStart, center, flexEnd, stretch }
public enum Justify: Equatable { case flexStart, center, flexEnd, spaceBetween, spaceAround, spaceEvenly }
public enum FlexWrap: Equatable { case nowrap, wrap }
public enum Overflow: Equatable { case visible, hidden, scroll }
public enum Position: Equatable { case relative, absolute }
// `Display.none` and `TextDecoration.none` are always written in full: against an optional, a bare
// `.none` is Optional's.
public enum Display: Equatable { case flex, none }
public enum FontWeight: Equatable { case normal, bold }
public enum FontStyle: Equatable { case normal, italic }
public enum TextAlign: Equatable { case left, center, right }
public enum TextDecoration: Equatable { case none, underline, lineThrough }
public enum Easing: Equatable { case linear, ease, easeIn, easeOut, easeInOut, spring }

/// A struct cannot contain itself: a style's state styles (`pressed`…) sit behind a reference.
final class StyleRef: Equatable {
    let style: Style
    init(_ style: Style) { self.style = style }
    static func == (a: StyleRef, b: StyleRef) -> Bool { a === b || a.style == b.style }
}

/// The style subset every runtime lays out the same way, in points. Parameters follow the TypeScript `Style` order.
public struct Style: Equatable {
    public var flexDirection: FlexDirection?
    public var alignItems: Align?
    public var alignSelf: Align?
    public var justifyContent: Justify?
    public var flexWrap: FlexWrap?
    public var flex: Double?
    public var gap: Double?
    public var margin: Double?
    public var marginTop: Double?
    public var marginRight: Double?
    public var marginBottom: Double?
    public var marginLeft: Double?
    public var padding: Double?
    public var paddingTop: Double?
    public var paddingRight: Double?
    public var paddingBottom: Double?
    public var paddingLeft: Double?
    public var width: Double?
    public var height: Double?
    public var minWidth: Double?
    public var maxWidth: Double?
    public var minHeight: Double?
    public var maxHeight: Double?
    public var aspectRatio: Double?
    public var overflow: Overflow?
    public var position: Position?
    public var top: Double?
    public var right: Double?
    public var bottom: Double?
    public var left: Double?
    public var zIndex: Double?
    public var display: Display?
    public var backgroundColor: String?
    public var color: String?
    public var opacity: Double?
    public var borderRadius: Double?
    public var borderWidth: Double?
    public var borderColor: String?
    public var shadowColor: String?
    public var shadowRadius: Double?
    public var shadowOffsetX: Double?
    public var shadowOffsetY: Double?
    public var fontSize: Double?
    public var fontWeight: FontWeight?
    public var fontStyle: FontStyle?
    public var fontFamily: String?
    public var lineHeight: Double?
    public var letterSpacing: Double?
    public var textAlign: TextAlign?
    public var textDecoration: TextDecoration?
    public var numberOfLines: Double?
    public var translateX: Double?
    public var translateY: Double?
    public var scale: Double?
    public var rotate: Double?
    public var transitionDuration: Double?
    public var transitionDelay: Double?
    public var transitionEasing: Easing?
    var pressedRef: StyleRef?
    var hoverRef: StyleRef?
    var focusedRef: StyleRef?

    public var pressed: Style? { pressedRef?.style }
    public var hover: Style? { hoverRef?.style }
    public var focused: Style? { focusedRef?.style }

    public init(
        flexDirection: FlexDirection? = nil, alignItems: Align? = nil, alignSelf: Align? = nil, justifyContent: Justify? = nil,
        flexWrap: FlexWrap? = nil, flex: Double? = nil, gap: Double? = nil, margin: Double? = nil, marginTop: Double? = nil,
        marginRight: Double? = nil, marginBottom: Double? = nil, marginLeft: Double? = nil, padding: Double? = nil,
        paddingTop: Double? = nil, paddingRight: Double? = nil, paddingBottom: Double? = nil, paddingLeft: Double? = nil,
        width: Double? = nil, height: Double? = nil, minWidth: Double? = nil, maxWidth: Double? = nil, minHeight: Double? = nil,
        maxHeight: Double? = nil, aspectRatio: Double? = nil, overflow: Overflow? = nil, position: Position? = nil,
        top: Double? = nil, right: Double? = nil, bottom: Double? = nil, left: Double? = nil, zIndex: Double? = nil,
        display: Display? = nil, backgroundColor: String? = nil, color: String? = nil, opacity: Double? = nil,
        borderRadius: Double? = nil, borderWidth: Double? = nil, borderColor: String? = nil, shadowColor: String? = nil,
        shadowRadius: Double? = nil, shadowOffsetX: Double? = nil, shadowOffsetY: Double? = nil, fontSize: Double? = nil,
        fontWeight: FontWeight? = nil, fontStyle: FontStyle? = nil, fontFamily: String? = nil, lineHeight: Double? = nil,
        letterSpacing: Double? = nil, textAlign: TextAlign? = nil, textDecoration: TextDecoration? = nil,
        numberOfLines: Double? = nil, translateX: Double? = nil, translateY: Double? = nil, scale: Double? = nil,
        rotate: Double? = nil, transitionDuration: Double? = nil, transitionDelay: Double? = nil,
        transitionEasing: Easing? = nil, pressed: Style? = nil, hover: Style? = nil, focused: Style? = nil
    ) {
        self.flexDirection = flexDirection; self.alignItems = alignItems; self.alignSelf = alignSelf
        self.justifyContent = justifyContent; self.flexWrap = flexWrap; self.flex = flex; self.gap = gap
        self.margin = margin; self.marginTop = marginTop; self.marginRight = marginRight
        self.marginBottom = marginBottom; self.marginLeft = marginLeft
        self.padding = padding; self.paddingTop = paddingTop; self.paddingRight = paddingRight
        self.paddingBottom = paddingBottom; self.paddingLeft = paddingLeft
        self.width = width; self.height = height; self.minWidth = minWidth; self.maxWidth = maxWidth
        self.minHeight = minHeight; self.maxHeight = maxHeight; self.aspectRatio = aspectRatio
        self.overflow = overflow; self.position = position
        self.top = top; self.right = right; self.bottom = bottom; self.left = left
        self.zIndex = zIndex; self.display = display
        self.backgroundColor = backgroundColor; self.color = color; self.opacity = opacity
        self.borderRadius = borderRadius; self.borderWidth = borderWidth; self.borderColor = borderColor
        self.shadowColor = shadowColor; self.shadowRadius = shadowRadius
        self.shadowOffsetX = shadowOffsetX; self.shadowOffsetY = shadowOffsetY
        self.fontSize = fontSize; self.fontWeight = fontWeight; self.fontStyle = fontStyle; self.fontFamily = fontFamily
        self.lineHeight = lineHeight; self.letterSpacing = letterSpacing; self.textAlign = textAlign
        self.textDecoration = textDecoration; self.numberOfLines = numberOfLines
        self.translateX = translateX; self.translateY = translateY; self.scale = scale; self.rotate = rotate
        self.transitionDuration = transitionDuration; self.transitionDelay = transitionDelay
        self.transitionEasing = transitionEasing
        self.pressedRef = pressed.map { StyleRef($0) }
        self.hoverRef = hover.map { StyleRef($0) }
        self.focusedRef = focused.map { StyleRef($0) }
    }

    /// `o`'s set values win, as later declarations do in CSS; a `padding` or `margin` shorthand resets the sides before it.
    public func merged(_ o: Style) -> Style {
        var s = self
        s.flexDirection = o.flexDirection ?? s.flexDirection
        s.alignItems = o.alignItems ?? s.alignItems
        s.alignSelf = o.alignSelf ?? s.alignSelf
        s.justifyContent = o.justifyContent ?? s.justifyContent
        s.flexWrap = o.flexWrap ?? s.flexWrap
        s.flex = o.flex ?? s.flex
        s.gap = o.gap ?? s.gap
        if let m = o.margin {
            s.margin = m; s.marginTop = nil; s.marginRight = nil; s.marginBottom = nil; s.marginLeft = nil
        }
        s.marginTop = o.marginTop ?? s.marginTop
        s.marginRight = o.marginRight ?? s.marginRight
        s.marginBottom = o.marginBottom ?? s.marginBottom
        s.marginLeft = o.marginLeft ?? s.marginLeft
        if let p = o.padding {
            s.padding = p; s.paddingTop = nil; s.paddingRight = nil; s.paddingBottom = nil; s.paddingLeft = nil
        }
        s.paddingTop = o.paddingTop ?? s.paddingTop
        s.paddingRight = o.paddingRight ?? s.paddingRight
        s.paddingBottom = o.paddingBottom ?? s.paddingBottom
        s.paddingLeft = o.paddingLeft ?? s.paddingLeft
        s.width = o.width ?? s.width
        s.height = o.height ?? s.height
        s.minWidth = o.minWidth ?? s.minWidth
        s.maxWidth = o.maxWidth ?? s.maxWidth
        s.minHeight = o.minHeight ?? s.minHeight
        s.maxHeight = o.maxHeight ?? s.maxHeight
        s.aspectRatio = o.aspectRatio ?? s.aspectRatio
        s.overflow = o.overflow ?? s.overflow
        s.position = o.position ?? s.position
        s.top = o.top ?? s.top
        s.right = o.right ?? s.right
        s.bottom = o.bottom ?? s.bottom
        s.left = o.left ?? s.left
        s.zIndex = o.zIndex ?? s.zIndex
        s.display = o.display ?? s.display
        s.backgroundColor = o.backgroundColor ?? s.backgroundColor
        s.color = o.color ?? s.color
        s.opacity = o.opacity ?? s.opacity
        s.borderRadius = o.borderRadius ?? s.borderRadius
        s.borderWidth = o.borderWidth ?? s.borderWidth
        s.borderColor = o.borderColor ?? s.borderColor
        s.shadowColor = o.shadowColor ?? s.shadowColor
        s.shadowRadius = o.shadowRadius ?? s.shadowRadius
        s.shadowOffsetX = o.shadowOffsetX ?? s.shadowOffsetX
        s.shadowOffsetY = o.shadowOffsetY ?? s.shadowOffsetY
        s.fontSize = o.fontSize ?? s.fontSize
        s.fontWeight = o.fontWeight ?? s.fontWeight
        s.fontStyle = o.fontStyle ?? s.fontStyle
        s.fontFamily = o.fontFamily ?? s.fontFamily
        s.lineHeight = o.lineHeight ?? s.lineHeight
        s.letterSpacing = o.letterSpacing ?? s.letterSpacing
        s.textAlign = o.textAlign ?? s.textAlign
        s.textDecoration = o.textDecoration ?? s.textDecoration
        s.numberOfLines = o.numberOfLines ?? s.numberOfLines
        s.translateX = o.translateX ?? s.translateX
        s.translateY = o.translateY ?? s.translateY
        s.scale = o.scale ?? s.scale
        s.rotate = o.rotate ?? s.rotate
        s.transitionDuration = o.transitionDuration ?? s.transitionDuration
        s.transitionDelay = o.transitionDelay ?? s.transitionDelay
        s.transitionEasing = o.transitionEasing ?? s.transitionEasing
        s.pressedRef = Style.mergedState(s.pressedRef, o.pressedRef)
        s.hoverRef = Style.mergedState(s.hoverRef, o.hoverRef)
        s.focusedRef = Style.mergedState(s.focusedRef, o.focusedRef)
        return s
    }

    private static func mergedState(_ mine: StyleRef?, _ theirs: StyleRef?) -> StyleRef? {
        guard let theirs else { return mine }
        guard let mine else { return theirs }
        return StyleRef(mine.style.merged(theirs.style))
    }

    /// The properties a child takes from its parent unless it sets them.
    var inherited: Style {
        Style(
            color: color, fontSize: fontSize, fontWeight: fontWeight, fontStyle: fontStyle, fontFamily: fontFamily,
            lineHeight: lineHeight, letterSpacing: letterSpacing, textAlign: textAlign
        )
    }

    /// Padding plus border.
    var insets: UIEdgeInsets {
        let b = borderWidth ?? 0
        return UIEdgeInsets(
            top: CGFloat((paddingTop ?? padding ?? 0) + b), left: CGFloat((paddingLeft ?? padding ?? 0) + b),
            bottom: CGFloat((paddingBottom ?? padding ?? 0) + b), right: CGFloat((paddingRight ?? padding ?? 0) + b)
        )
    }

    var margins: UIEdgeInsets {
        UIEdgeInsets(
            top: CGFloat(marginTop ?? margin ?? 0), left: CGFloat(marginLeft ?? margin ?? 0),
            bottom: CGFloat(marginBottom ?? margin ?? 0), right: CGFloat(marginRight ?? margin ?? 0)
        )
    }

    var hasShadow: Bool { shadowRadius != nil || shadowColor != nil }

    /// What a plain UILabel has no property for: the text is then set as an attributed string.
    var richText: Bool {
        if letterSpacing != nil || lineHeight != nil { return true }
        return textDecoration == .underline || textDecoration == .lineThrough
    }

    /// The style without what only paints or transforms: two styles equal here give the same boxes.
    private var layoutOnly: Style {
        var s = self
        s.overflow = nil; s.backgroundColor = nil; s.color = nil; s.opacity = nil; s.borderRadius = nil; s.borderColor = nil
        s.shadowColor = nil; s.shadowRadius = nil; s.shadowOffsetX = nil; s.shadowOffsetY = nil
        s.textAlign = nil; s.textDecoration = nil
        s.translateX = nil; s.translateY = nil; s.scale = nil; s.rotate = nil
        s.transitionDuration = nil; s.transitionDelay = nil; s.transitionEasing = nil
        s.pressedRef = nil; s.hoverRef = nil; s.focusedRef = nil
        return s
    }

    /// Whether `o` gives the same boxes: a change of paint or transform alone needs no layout pass.
    func sameLayout(_ o: Style) -> Bool { layoutOnly == o.layoutOnly }
}

public struct StyleClass: NodeMod {
    let style: Style
    public func apply(to node: Node) { node.classes.append(style) }
}

@MainActor public func css(_ style: Style) -> StyleClass { StyleClass(style: style) }

@MainActor public func cx(_ classes: StyleClass?...) -> StyleClass {
    StyleClass(style: classes.compactMap { $0?.style }.reduce(Style()) { $0.merged($1) })
}

public struct Compound {
    let match: [String: String]
    let style: Style
    public init(_ match: [String: String], _ style: Style) { self.match = match; self.style = style }
}

/// A variants() recipe: base, then each selected value, then the compounds that match. Combinations are cached.
@MainActor public final class Variants {
    private let base: Style
    private let variants: [String: [String: Style]]
    private let defaults: [String: String]
    private let compounds: [Compound]
    private var cache: [String: StyleClass] = [:]

    public init(base: Style, variants: [String: [String: Style]], defaults: [String: String], compounds: [Compound]) {
        self.base = base; self.variants = variants; self.defaults = defaults; self.compounds = compounds
    }

    public func callAsFunction(_ selection: [String: String] = [:]) -> StyleClass {
        var chosen = defaults.merging(selection) { $1 }
        for (group, values) in variants where chosen[group] == nil && values["false"] != nil { chosen[group] = "false" }
        let key = chosen.keys.sorted().map { "\($0)=\(chosen[$0]!)" }.joined(separator: ";")
        if let hit = cache[key] { return hit }
        var style = base
        for group in variants.keys.sorted() { if let value = chosen[group], let s = variants[group]?[value] { style = style.merged(s) } }
        for c in compounds where c.match.allSatisfy({ chosen[$0.key] == $0.value }) { style = style.merged(c.style) }
        let result = StyleClass(style: style)
        cache[key] = result
        return result
    }
}

private func parseColor(_ value: String?) -> UIColor? {
    guard var hex = value?.trimmingCharacters(in: .whitespaces).lowercased() else { return nil }
    switch hex {
    case "transparent": return .clear
    case "white": return .white
    case "black": return .black
    case "red": return .red
    default: break
    }
    guard hex.hasPrefix("#") else { return nil }
    hex.removeFirst()
    if hex.count == 3 || hex.count == 4 { hex = hex.map { "\($0)\($0)" }.joined() }
    guard hex.count == 6 || hex.count == 8, let n = UInt64(hex, radix: 16) else { return nil }
    let rgba = hex.count == 6 ? (n << 8) | 0xff : n
    return UIColor(
        red: CGFloat((rgba >> 24) & 0xff) / 255, green: CGFloat((rgba >> 16) & 0xff) / 255,
        blue: CGFloat((rgba >> 8) & 0xff) / 255, alpha: CGFloat(rgba & 0xff) / 255
    )
}

private let textTags: Set<String> = [
    "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label", "strong", "b", "small", "em", "i", "u", "s", "del", "ins", "mark", "code",
    "pre", "kbd", "samp", "var", "abbr", "cite", "q", "dfn", "sub", "sup", "time", "legend", "caption", "figcaption", "summary", "dt", "dd", "a",
]

/// What the browser (and nuclo-native) give each tag before any style.
private func tagStyle(_ tag: String) -> Style {
    switch tag {
    case "h1": return Style(fontSize: 32, fontWeight: .bold)
    case "h2": return Style(fontSize: 22, fontWeight: .bold)
    case "h3": return Style(fontSize: 19, fontWeight: .bold)
    case "h4": return Style(fontSize: 17, fontWeight: .bold)
    case "h5": return Style(fontSize: 15, fontWeight: .bold)
    case "h6": return Style(fontSize: 13, fontWeight: .bold)
    case "strong", "b", "dt": return Style(fontWeight: .bold)
    case "th": return Style(flex: 1, fontWeight: .bold)
    case "td": return Style(flex: 1)
    case "tr": return Style(flexDirection: .row)
    case "small", "sub", "sup": return Style(fontSize: 12)
    case "em", "i", "cite", "dfn", "var": return Style(fontStyle: .italic)
    case "u", "ins": return Style(textDecoration: .underline)
    case "s", "del": return Style(textDecoration: .lineThrough)
    case "mark": return Style(backgroundColor: "#fef08a")
    case "code", "pre", "kbd", "samp": return Style(fontFamily: "monospace")
    case "a": return Style(color: "#2563eb")
    case "hr": return Style(height: 1, backgroundColor: "#cbd5e1")
    case "button": return Style(paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14, color: "#2563eb")
    case "input", "textarea": return Style(padding: 8)
    default: return Style()
    }
}

private func textFont(_ s: Style) -> UIFont {
    let size = CGFloat(s.fontSize ?? 15)
    let weight: UIFont.Weight = s.fontWeight == .bold ? .bold : .regular
    let system = UIFont.systemFont(ofSize: size, weight: weight)
    let family = s.fontFamily ?? "sans-serif"
    var font = system
    var traits: UIFontDescriptor.SymbolicTraits = []
    if family == "monospace" {
        font = .monospacedSystemFont(ofSize: size, weight: weight)
    } else if family == "serif" {
        if let serif = system.fontDescriptor.withDesign(.serif) { font = UIFont(descriptor: serif, size: size) }
    } else if family != "sans-serif", let named = UIFont(name: family, size: size) {
        font = named
        if s.fontWeight == .bold { traits.insert(.traitBold) }
    }
    if s.fontStyle == .italic { traits.insert(.traitItalic) }
    guard !traits.isEmpty, let styled = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.union(traits)) else { return font }
    return UIFont(descriptor: styled, size: size)
}

/// Translate, then rotate, then scale, around the box's centre (as CSS `translate() rotate() scale()`).
private func boxTransform(_ s: Style) -> CGAffineTransform {
    let scale = CGFloat(s.scale ?? 1)
    return CGAffineTransform(translationX: CGFloat(s.translateX ?? 0), y: CGFloat(s.translateY ?? 0))
        .rotated(by: CGFloat(s.rotate ?? 0) * .pi / 180)
        .scaledBy(x: scale, y: scale)
}

/// Runs `changes` as the transition `s` describes.
@MainActor private func animate(_ s: Style, _ changes: @escaping () -> Void) {
    let duration = (s.transitionDuration ?? 0) / 1000
    let delay = (s.transitionDelay ?? 0) / 1000
    var options: UIView.AnimationOptions = [.allowUserInteraction, .beginFromCurrentState]
    let easing = s.transitionEasing ?? .ease
    switch easing {
    case .spring:
        UIView.animate(
            withDuration: duration, delay: delay, usingSpringWithDamping: 0.6, initialSpringVelocity: 0,
            options: options, animations: changes
        )
        return
    case .linear: options.insert(.curveLinear)
    case .easeIn: options.insert(.curveEaseIn)
    case .easeOut: options.insert(.curveEaseOut)
    case .easeInOut, .ease: options.insert(.curveEaseInOut)
    }
    // UIKit has no option for CSS `ease`: the transaction's timing function gives its curve (0.25, 0.1, 0.25, 1).
    if easing == .ease {
        CATransaction.begin()
        CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: .default))
    }
    UIView.animate(withDuration: duration, delay: delay, options: options, animations: changes)
    if easing == .ease { CATransaction.commit() }
}

private func clamp(_ value: CGFloat, _ low: CGFloat?, _ high: CGFloat?) -> CGFloat {
    var v = value
    if let high { v = min(v, high) }
    if let low { v = max(v, low) }
    return v
}

private func points(_ value: Double?) -> CGFloat? {
    value.map { CGFloat($0) }
}

// MARK: - Node

@MainActor public final class Node: NodeMod {
    enum Kind { case box, text, button, input, checkbox, textarea, image, native, fragment }

    let kind: Kind
    let tag: String
    /// A box's container. It is the box's `view`, unless the box scrolls: then the scroller around it is.
    let flex: FlexView?
    /// What the parent places.
    private(set) var view: UIView?
    weak var parent: Node?
    var children: [Node] = []
    var scopes = Set<String>()

    /// Dynamic values, re-run by update().
    var bindings: [@MainActor () -> Void] = []
    /// list/when/region: reconciles `children` before they refresh.
    var reconcile: (@MainActor () -> Void)?
    /// Fragment teardown (into() leaving its region, a region going away).
    var teardown: [@MainActor () -> Void] = []

    var mountCallbacks: [@MainActor (UIView) -> Cleanup?] = []
    var destroyCallbacks: [@MainActor (UIView) -> Void] = []
    private var cleanups: [Cleanup] = []
    private var mounted = false
    private var watching = false
    private(set) var destroyed = false

    private var textParts: [@MainActor () -> String] = []
    private var lastText: String?
    /// The label shows an attributed string (see Style.richText).
    private var rich = false

    var classes: [Style] = []
    var dynamicClass: (@MainActor () -> StyleClass)?
    var inline = Style()
    var dynamicInline: (@MainActor () -> Style)?
    private(set) var computed = Style()
    private var painted: Style?
    /// The frame the parent's layout gave.
    private var placed: CGRect?

    /// The update pass this node was built in: its bindings already ran then.
    private let born: Int

    private var listeners: [String: @MainActor (NativeEvent) -> Void] = [:]
    private var onKey: (@MainActor (KeyboardEvent) -> Void)?
    private var textDelegate: TextViewDelegate?
    private(set) var touch: Touch?
    var onScroll: (@MainActor (ScrollEvent) -> Void)?
    var href: String?
    private var pressedNow = false
    private var hoveredNow = false
    private var focusedNow = false
    private(set) var disabledNow = false

    /// A native component's props, and whether one changed since its last `update`.
    var nativeProps: Any?
    var propsDirty = true

    init(_ kind: Kind, tag: String, native: UIView? = nil) {
        born = Runtime.shared.generation
        self.kind = kind
        self.tag = tag
        var flex: FlexView?
        switch kind {
        case .box:
            flex = FlexView()
            view = flex
        case .text: view = PaddedLabel()
        case .button: view = NButton()
        case .input: view = PaddedTextField()
        case .checkbox: view = UISwitch()
        case .textarea:
            let textView = UITextView()
            textView.isScrollEnabled = false
            textView.backgroundColor = .clear
            // The padding is the style's alone, as on the other platforms.
            textView.textContainer.lineFragmentPadding = 0
            view = textView
        case .image:
            let image = UIImageView()
            image.contentMode = .scaleAspectFill
            view = image
        case .native: view = native
        case .fragment: view = nil
        }
        self.flex = flex
        flex?.node = self
        wireEvents()
    }

    public func apply(to node: Node) { node.append(self) }

    func append(_ child: Node) {
        child.parent = self
        children.append(child)
    }

    func add(_ mods: [NodeMod?]) {
        for mod in mods { mod?.apply(to: self) }
    }

    /// Called once the builder applied its arguments: a box that scrolls gets its scroller, then its views.
    func finish() {
        if let flex {
            var s = tagStyle(tag)
            for c in classes { s = s.merged(c) }
            s = s.merged(inline)
            // `overflow: scroll` is read from the static styles: the scroller has to exist before the box is placed.
            if s.overflow == .scroll {
                let scroller = ScrollBox(flex, horizontal: s.flexDirection == .row)
                scroller.node = self
                view = scroller
            }
        }
        syncViews()
    }

    var scrolls: Bool { flex != nil && view !== flex }

    /// The view the content sits in: a scrolling box's container is inside its `view`.
    private var innermost: UIView? {
        if let flex { return flex }
        return view
    }

    /// The nearest node with a view: where this node's views are inserted.
    private var host: Node? {
        var n = parent
        while let current = n, current.view == nil { n = current.parent }
        return n
    }

    /// This node's views in order: its own, or a fragment's children's.
    var flatViews: [Node] { view != nil ? [self] : children.flatMap { $0.flatViews } }

    /// Puts the child views where the node tree says they are.
    func syncViews() {
        if let flex { flex.setItems(children.flatMap { $0.flatViews }) } else { host?.syncViews() }
    }

    /// Asks for a layout pass from this view up to its screen, as far as a change of its size can reach.
    /// Returns the last view marked.
    @discardableResult func invalidateLayout() -> UIView? {
        var top: UIView?
        var v = innermost
        while let current = v {
            current.setNeedsLayout()
            top = current
            if current is ScreenRoot { break }
            v = current.superview
        }
        return top
    }

    // MARK: Bindings

    /// Runs `get` now and on each update; `set` only sees values that changed (or every value, in forceUpdate()).
    func bind<T: Equatable>(_ get: @escaping @MainActor () -> T, _ set: @escaping @MainActor (T) -> Void) {
        var first = true
        var last: T?
        let run: @MainActor () -> Void = {
            let value = get()
            if first || Runtime.shared.forcing || value != last {
                first = false
                last = value
                set(value)
            }
        }
        run()
        bindings.append(run)
    }

    func addText(_ part: @escaping @MainActor () -> String) {
        switch kind {
        case .text, .button:
            if textParts.isEmpty { bindings.append { [unowned self] in self.renderText() } }
            textParts.append(part)
            renderText()
        case .box, .fragment:
            let child = Node(.text, tag: "span")
            child.addText(part)
            append(child)
        default:
            break
        }
    }

    private func renderText() {
        let text = textParts.count == 1 ? textParts[0]() : textParts.map { $0() }.joined()
        guard text != lastText else { return }
        lastText = text
        setText()
        invalidateLayout()
    }

    private var label: PaddedLabel? { (view as? PaddedLabel) ?? (view as? NButton)?.label }

    /// Writes the text into the label: plain, or with the attributes a UILabel has no property for.
    private func setText() {
        guard let label else { return }
        let text = lastText ?? ""
        guard rich else {
            label.text = text
            return
        }
        let s = computed
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = label.textAlignment
        if s.numberOfLines != nil { paragraph.lineBreakMode = .byTruncatingTail }
        if let lineHeight = s.lineHeight {
            paragraph.minimumLineHeight = CGFloat(lineHeight)
            paragraph.maximumLineHeight = CGFloat(lineHeight)
        }
        var attributes: [NSAttributedString.Key: Any] = [
            .font: textFont(s),
            .foregroundColor: parseColor(s.color) ?? UIColor.black,
            .paragraphStyle: paragraph,
        ]
        if let spacing = s.letterSpacing { attributes[.kern] = CGFloat(spacing) }
        if s.textDecoration == .underline { attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue }
        if s.textDecoration == .lineThrough { attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue }
        label.attributedText = NSAttributedString(string: text, attributes: attributes)
    }

    // MARK: Refresh

    func refresh() {
        guard !destroyed, born != Runtime.shared.generation else { return }
        reconcile?()
        for binding in bindings { binding() }
        applyStyle()
        for child in children { child.refresh() }
    }

    func applyStylesDeep() {
        applyStyle()
        for child in children { child.applyStylesDeep() }
    }

    func applyStyle() {
        guard let view else {
            computed = parent?.computed ?? Style()
            return
        }
        var s = (parent?.computed.inherited ?? Style()).merged(tagStyle(tag))
        for c in classes { s = s.merged(c) }
        if let dynamicClass { s = s.merged(dynamicClass().style) }
        s = s.merged(inline)
        if let dynamicInline { s = s.merged(dynamicInline()) }
        if s.hover != nil { touched()?.watchHover() }
        if hoveredNow, let hover = s.hover { s = s.merged(hover) }
        if focusedNow, let focused = s.focused { s = s.merged(focused) }
        if s.pressed != nil { _ = touched() }
        if pressedNow, let pressed = s.pressed { s = s.merged(pressed) }
        let before = painted
        if s == before && !Runtime.shared.forcing { return }
        computed = s
        painted = s
        paint(view, s, before)
        guard let before else {
            invalidateLayout()
            return
        }
        if s.sameLayout(before) { return }
        let top = invalidateLayout()
        if before.zIndex != s.zIndex { (view.superview as? FlexView)?.reorder() }
        // A change of `width` or `height` under a transition: the layout pass it causes is animated,
        // so the boxes around this one follow it, as they do in a browser.
        let widthMoves = before.width != nil && s.width != nil && before.width != s.width
        let heightMoves = before.height != nil && s.height != nil && before.height != s.height
        if let top, (s.transitionDuration ?? 0) > 0, widthMoves || heightMoves { Runtime.shared.animateLayout(top, s) }
    }

    private func paint(_ view: UIView, _ s: Style, _ before: Style?) {
        let clips = s.overflow == .hidden || s.overflow == .scroll
        // A scroller (and a textarea, which is one) always clips its content.
        view.clipsToBounds = clips || kind == .image || view is UIScrollView
        view.isHidden = s.display == Display.none
        view.layer.borderWidth = CGFloat(s.borderWidth ?? 0)
        view.layer.borderColor = (parseColor(s.borderColor) ?? UIColor.black).cgColor
        if s.hasShadow {
            // As CSS: the colour carries the shadow's alpha, and the blur radius is twice the layer's (a standard deviation).
            view.layer.shadowColor = (parseColor(s.shadowColor) ?? UIColor(white: 0, alpha: 0.25)).cgColor
            view.layer.shadowOpacity = 1
            view.layer.shadowRadius = CGFloat(s.shadowRadius ?? 0) / 2
            view.layer.shadowOffset = CGSize(width: CGFloat(s.shadowOffsetX ?? 0), height: CGFloat(s.shadowOffsetY ?? 0))
        } else {
            view.layer.shadowOpacity = 0
        }
        shadowPath()

        let background = parseColor(s.backgroundColor) ?? UIColor.clear
        let alpha = CGFloat(s.opacity ?? 1) * (disabledNow ? 0.4 : 1)
        let transform = boxTransform(s)
        let radius = CGFloat(s.borderRadius ?? 0)
        let changes = {
            view.backgroundColor = background
            view.alpha = alpha
            view.transform = transform
            view.layer.cornerRadius = radius
        }
        // A transition animates what changed since the last paint; the first paint is applied at once.
        if before != nil && (s.transitionDuration ?? 0) > 0 {
            animate(s, changes)
        } else {
            // A transition still running (a card springing back, grabbed again) must not add to the new values.
            if (before?.transitionDuration ?? 0) > 0 { view.layer.removeAllAnimations() }
            changes()
        }

        if kind != .native { paintText(view, s) }
    }

    private func paintText(_ view: UIView, _ s: Style) {
        let alignment: NSTextAlignment = s.textAlign == .center ? .center : s.textAlign == .right ? .right : .natural
        switch view {
        case let field as PaddedTextField:
            field.font = textFont(s)
            field.textColor = parseColor(s.color) ?? UIColor.black
            field.textAlignment = alignment
            field.insets = s.insets
        case let textView as UITextView:
            textView.font = textFont(s)
            textView.textColor = parseColor(s.color) ?? UIColor.black
            textView.textAlignment = alignment
            textView.textContainerInset = s.insets
        default:
            guard let label else { return }
            // Back to a plain string: the attributes of the last one must not stay on the label.
            if rich && !s.richText { label.attributedText = nil }
            rich = s.richText
            label.font = textFont(s)
            label.textColor = parseColor(s.color) ?? UIColor.black
            label.textAlignment = kind == .button ? .center : alignment
            label.numberOfLines = s.numberOfLines.map { Int($0) } ?? 0
            label.lineBreakMode = .byTruncatingTail
            label.insets = s.insets
            setText()
        }
    }

    /// The layer's shadow is cast by the box (rounded as it is), not by whatever its content draws.
    private func shadowPath() {
        guard let view else { return }
        view.layer.shadowPath = computed.hasShadow
            ? UIBezierPath(roundedRect: view.bounds, cornerRadius: CGFloat(computed.borderRadius ?? 0)).cgPath
            : nil
    }

    /// Places the view at the frame its parent's layout computed.
    func place(_ next: CGRect) {
        guard let view, next != placed else { return }
        let first = placed == nil
        placed = next
        // Bounds and centre, not `frame`: the view may be transformed.
        let move = {
            view.bounds.size = next.size
            view.center = CGPoint(x: next.midX, y: next.midY)
        }
        // A view that arrives during an animated layout pass appears in place: it has nowhere to come from.
        if first { UIView.performWithoutAnimation(move) } else { move() }
        if computed.hasShadow { shadowPath() }
    }

    // MARK: Lifecycle

    func watchMount() {
        guard let view, !watching else { return }
        watching = true
        let probe = MountProbe()
        probe.isHidden = true
        probe.onWindow = { [weak self] in self?.mount() }
        view.addSubview(probe)
        if view.window != nil { mount() }
    }

    private func mount() {
        guard !mounted, !destroyed, let view else { return }
        mounted = true
        for callback in mountCallbacks { if let cleanup = callback(view) { cleanups.append(cleanup) } }
    }

    /// Runs onDestroy and cleanups, children first; the views are removed by whoever removed the node.
    func destroy() {
        guard !destroyed else { return }
        for child in children { child.destroy() }
        destroyed = true
        for t in teardown { t() }
        for cleanup in cleanups { cleanup() }
        if let view { for callback in destroyCallbacks { callback(view) } }
        bindings.removeAll()
        reconcile = nil
    }

    // MARK: Events

    // UIKit reports no event when the runtime itself writes a control (`text`, `setOn`), so nothing
    // has to be silenced here as it is on Android.
    private func fire(_ type: String) {
        listeners[type]?(NativeEvent(target: target))
    }

    private func wireEvents() {
        switch view {
        case let button as NButton:
            button.addAction(UIAction { [weak self] _ in self?.click() }, for: .touchUpInside)
        case let field as PaddedTextField:
            field.addAction(UIAction { [weak self] _ in self?.fire("input") }, for: .editingChanged)
            field.addAction(UIAction { [weak self] _ in self?.focus(true) }, for: .editingDidBegin)
            field.addAction(UIAction { [weak self] _ in self?.focus(false) }, for: .editingDidEnd)
            field.addAction(
                UIAction { [weak self] _ in
                    self?.key("Enter")
                    self?.fire("change")
                },
                for: .editingDidEndOnExit
            )
            field.onKey = { [weak self] name in self?.key(name) }
        case let toggle as UISwitch:
            toggle.addAction(UIAction { [weak self] _ in self?.fire("change") }, for: .valueChanged)
        case let textView as UITextView where kind == .textarea:
            let delegate = TextViewDelegate()
            delegate.onChange = { [weak self] in
                self?.fire("input")
                self?.invalidateLayout()
            }
            delegate.onFocus = { [weak self] has in self?.focus(has) }
            delegate.onKey = { [weak self] name in self?.key(name) }
            textView.delegate = delegate
            textDelegate = delegate
        default:
            break
        }
    }

    private func focus(_ has: Bool) {
        focusedNow = has
        if computed.focused != nil { applyStyle() }
        fire(has ? "focus" : "blur")
    }

    private func key(_ name: String) {
        onKey?(KeyboardEvent(key: name))
    }

    func listen(_ type: String, _ handler: @escaping @MainActor (NativeEvent) -> Void) {
        listeners[type] = handler
        if type == "click" { enableClick() }
    }

    func listenKeys(_ handler: @escaping @MainActor (KeyboardEvent) -> Void) {
        onKey = handler
    }

    /// A button clicks by itself and a control keeps its own touches; any other view gets a tap.
    func enableClick() {
        if kind != .button && kind != .input && kind != .textarea && kind != .checkbox { touched()?.enableTap() }
    }

    /// A click: the app's handler, then a link's URL.
    func click() {
        guard !disabledNow else { return }
        fire("click")
        if let href, let url = URL(string: href) { UIApplication.shared.open(url) }
    }

    /// The view's pointers and gestures, made on first use (a fragment has none).
    func touched() -> Touch? {
        if touch == nil, let target = innermost { touch = Touch(self, target) }
        return touch
    }

    func setPressed(_ down: Bool) {
        guard pressedNow != down else { return }
        pressedNow = down
        if computed.pressed != nil || painted?.pressed != nil { applyStyle() }
    }

    func setHovered(_ over: Bool) {
        guard hoveredNow != over else { return }
        hoveredNow = over
        applyStyle()
    }

    func setDisabled(_ off: Bool) {
        disabledNow = off
        (view as? UIControl)?.isEnabled = !off
        view?.alpha = CGFloat(computed.opacity ?? 1) * (off ? 0.4 : 1)
    }

    private var target: InputTarget {
        switch view {
        case let field as UITextField: return InputTarget(value: field.text ?? "", checked: false)
        case let textView as UITextView: return InputTarget(value: textView.text ?? "", checked: false)
        case let toggle as UISwitch: return InputTarget(value: toggle.isOn ? "on" : "", checked: toggle.isOn)
        default: return InputTarget(value: "", checked: false)
        }
    }

    // MARK: Measuring

    var inFlow: Bool { computed.position != .absolute && computed.display != Display.none }

    /// The border-box size this node takes when given at most `maxWidth`.
    /// `exact`: the width is decided (a flex share, a stretch), and only the height is asked.
    func measure(maxWidth: CGFloat, exact: Bool = false) -> CGSize {
        let s = computed
        var width = points(s.width)
        var height = points(s.height)
        if exact && width == nil { width = maxWidth }
        if let ratio = points(s.aspectRatio), ratio > 0 {
            if let w = width, height == nil {
                height = w / ratio
            } else if let h = height, width == nil {
                width = h * ratio
            }
        }
        let minW = points(s.minWidth)
        let maxW = points(s.maxWidth)
        if let w = width { width = clamp(w, minW, maxW) }
        var available = maxWidth
        if let width {
            available = width
        } else if let maxW {
            available = min(maxW, maxWidth)
        }
        guard let view else { return .zero }
        var size: CGSize
        if let flex {
            size = flex.measure(width: available, height: height, fit: width == nil)
        } else if view is UISwitch {
            size = CGSize(width: 51, height: 31)
        } else if view is UIImageView {
            size = CGSize(width: min(available, 120), height: height ?? width ?? 120)
        } else if let field = view as? PaddedTextField {
            let line = (field.font ?? UIFont.systemFont(ofSize: 15)).lineHeight.rounded(.up)
            size = CGSize(width: min(available, 180), height: line + field.insets.top + field.insets.bottom + 6)
        } else {
            let fit = view.sizeThatFits(CGSize(width: available, height: CGFloat.greatestFiniteMagnitude))
            size = CGSize(width: min(fit.width.rounded(.up), available), height: fit.height.rounded(.up))
        }
        if let width { size.width = width } else { size.width = clamp(size.width, minW, maxW) }
        if let height { size.height = height }
        size.height = clamp(size.height, points(s.minHeight), points(s.maxHeight))
        return size
    }
}

final class MountProbe: UIView {
    var onWindow: (@MainActor () -> Void)?
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil { onWindow?() }
    }
}

@MainActor final class TextViewDelegate: NSObject, UITextViewDelegate {
    var onChange: (@MainActor () -> Void)?
    var onFocus: (@MainActor (Bool) -> Void)?
    var onKey: (@MainActor (String) -> Void)?

    func textViewDidChange(_ textView: UITextView) { onChange?() }
    func textViewDidBeginEditing(_ textView: UITextView) { onFocus?(true) }
    func textViewDidEndEditing(_ textView: UITextView) { onFocus?(false) }

    // The on-screen keyboard sends no key events: Enter and Backspace are read from the edit.
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if text == "\n" { onKey?("Enter") } else if text.isEmpty && range.length > 0 { onKey?("Backspace") }
        return true
    }
}

/// DOM `key` names for the keys of a hardware keyboard an app is likely to handle.
@MainActor private func keyName(_ key: UIKey) -> String {
    switch key.keyCode {
    case .keyboardEscape: return "Escape"
    case .keyboardTab: return "Tab"
    case .keyboardDeleteForward: return "Delete"
    case .keyboardLeftArrow: return "ArrowLeft"
    case .keyboardRightArrow: return "ArrowRight"
    case .keyboardUpArrow: return "ArrowUp"
    case .keyboardDownArrow: return "ArrowDown"
    default: return key.characters
    }
}

// MARK: - Pointers and gestures

/// Reports a view's first touch without ever recognizing a gesture, so it takes nothing from the
/// taps, pans and controls around it. A scroller that starts scrolling ends it, as a cancel.
final class PointerRecognizer: UIGestureRecognizer {
    var onPointer: (@MainActor (String, PointerEvent) -> Void)?
    private var tracked: UITouch?
    private var last = PointerEvent(x: 0, y: 0, pageX: 0, pageY: 0, pointerId: 0)

    private func report(_ type: String, _ touch: UITouch) {
        let p = touch.location(in: view)
        let page = touch.location(in: nil)
        last = PointerEvent(x: Double(p.x), y: Double(p.y), pageX: Double(page.x), pageY: Double(page.y), pointerId: 0)
        onPointer?(type, last)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard tracked == nil, let touch = touches.first else { return }
        tracked = touch
        report("pointerDown", touch)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        if let touch = tracked, touches.contains(touch) { report("pointerMove", touch) }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        finish("pointerUp", touches)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        finish("pointerCancel", touches)
    }

    private func finish(_ type: String, _ touches: Set<UITouch>) {
        guard let touch = tracked, touches.contains(touch) else { return }
        tracked = nil
        report(type, touch)
        state = .failed
    }

    override func reset() {
        super.reset()
        // Reset while a touch is down: a scroller took the touch.
        if tracked != nil {
            tracked = nil
            onPointer?("pointerCancel", last)
        }
    }

    override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool { false }

    override func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool {
        preventingGestureRecognizer is UIPanGestureRecognizer && preventingGestureRecognizer.view is UIScrollView
    }
}

/// A view's pointers and gestures: the press state and pointer events from its touches, and a tap,
/// a pan, a pinch, a long press and a double tap from the platform's recognizers. A view with a pan
/// or a pinch keeps the gesture: a scrolling ancestor waits for it, so it does not scroll.
@MainActor final class Touch: NSObject, UIGestureRecognizerDelegate {
    private weak var node: Node?
    private let view: UIView
    var pointers: [String: @MainActor (PointerEvent) -> Void] = [:]
    private var onPan: (@MainActor (PanEvent) -> Void)?
    private var onPinch: (@MainActor (PinchEvent) -> Void)?
    private var tap: UITapGestureRecognizer?
    private var hover: UIHoverGestureRecognizer?
    private var holds: [UIGestureRecognizer] = []
    private var made = Set<String>()

    init(_ node: Node, _ view: UIView) {
        self.node = node
        self.view = view
        super.init()
        // A label takes no touches until something listens.
        view.isUserInteractionEnabled = true
        let pointer = PointerRecognizer(target: nil, action: nil)
        pointer.cancelsTouchesInView = false
        pointer.delaysTouchesEnded = false
        pointer.onPointer = { [weak self] type, event in
            guard let self else { return }
            if type == "pointerDown" { self.node?.setPressed(true) }
            if type == "pointerUp" || type == "pointerCancel" { self.node?.setPressed(false) }
            self.pointers[type]?(event)
        }
        view.addGestureRecognizer(pointer)
    }

    func enableTap() {
        guard tap == nil else { return }
        let g = UITapGestureRecognizer(target: self, action: #selector(tapped))
        g.delegate = self
        view.addGestureRecognizer(g)
        tap = g
    }

    func watchHover() {
        guard hover == nil else { return }
        let g = UIHoverGestureRecognizer(target: self, action: #selector(hovered(_:)))
        view.addGestureRecognizer(g)
        hover = g
    }

    func pan(_ handler: @escaping @MainActor (PanEvent) -> Void) {
        onPan = handler
        guard made.insert("pan").inserted else { return }
        let g = UIPanGestureRecognizer(target: self, action: #selector(panned(_:)))
        g.delegate = self
        view.addGestureRecognizer(g)
        holds.append(g)
    }

    func pinch(_ handler: @escaping @MainActor (PinchEvent) -> Void) {
        onPinch = handler
        guard made.insert("pinch").inserted else { return }
        let g = UIPinchGestureRecognizer(target: self, action: #selector(pinched(_:)))
        g.delegate = self
        view.addGestureRecognizer(g)
        holds.append(g)
    }

    func longPress(_ handler: @escaping @MainActor (PointerEvent) -> Void) {
        pointers["longPress"] = handler
        guard made.insert("longPress").inserted else { return }
        let g = UILongPressGestureRecognizer(target: self, action: #selector(longPressed(_:)))
        g.minimumPressDuration = 0.5
        view.addGestureRecognizer(g)
    }

    func doubleClick(_ handler: @escaping @MainActor (PointerEvent) -> Void) {
        pointers["doubleClick"] = handler
        guard made.insert("doubleClick").inserted else { return }
        let g = UITapGestureRecognizer(target: self, action: #selector(doubleTapped(_:)))
        g.numberOfTapsRequired = 2
        g.delegate = self
        view.addGestureRecognizer(g)
    }

    private func pointer(_ g: UIGestureRecognizer) -> PointerEvent {
        let p = g.location(in: view)
        let page = g.location(in: nil)
        return PointerEvent(x: Double(p.x), y: Double(p.y), pageX: Double(page.x), pageY: Double(page.y), pointerId: 0)
    }

    private func phase(_ g: UIGestureRecognizer) -> String? {
        switch g.state {
        case .began: return "start"
        case .changed: return "move"
        case .ended: return "end"
        case .cancelled, .failed: return "cancel"
        default: return nil
        }
    }

    @objc private func tapped() { node?.click() }

    @objc private func hovered(_ g: UIHoverGestureRecognizer) {
        node?.setHovered(g.state == .began || g.state == .changed)
    }

    @objc private func panned(_ g: UIPanGestureRecognizer) {
        guard let state = phase(g) else { return }
        // The translation counts from where the drag was recognized, so the view does not jump.
        if g.state == .began { g.setTranslation(.zero, in: nil) }
        // Translation and velocity in the window: the view may be following the finger.
        let t = g.translation(in: nil)
        let v = g.velocity(in: nil)
        let p = g.location(in: view)
        onPan?(
            PanEvent(
                state: state, translationX: Double(t.x), translationY: Double(t.y), velocityX: Double(v.x), velocityY: Double(v.y),
                x: Double(p.x), y: Double(p.y)
            )
        )
    }

    @objc private func pinched(_ g: UIPinchGestureRecognizer) {
        guard let state = phase(g) else { return }
        let p = g.location(in: view)
        onPinch?(PinchEvent(state: state, scale: g.state == .began ? 1 : Double(g.scale), focalX: Double(p.x), focalY: Double(p.y)))
    }

    @objc private func longPressed(_ g: UILongPressGestureRecognizer) {
        if g.state == .began { pointers["longPress"]?(pointer(g)) }
    }

    @objc private func doubleTapped(_ g: UITapGestureRecognizer) {
        pointers["doubleClick"]?(pointer(g))
    }

    /// A click fires on each tap of a double tap, as it does on the other platforms.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
        gestureRecognizer.view === other.view && gestureRecognizer is UITapGestureRecognizer && other is UITapGestureRecognizer
    }

    /// The scrollers around a view with a pan or a pinch wait for it to fail: the gesture is the view's.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool {
        guard holds.contains(gestureRecognizer), other is UIPanGestureRecognizer, let scroller = other.view as? UIScrollView else { return false }
        return view.isDescendant(of: scroller)
    }

    /// Controls and clickable views inside a clickable view keep their own taps.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        guard gestureRecognizer === tap else { return true }
        var v = touch.view
        while let current = v, current !== view {
            if current is UIControl || current is UITextView { return false }
            let taps = current.gestureRecognizers?.contains { ($0 as? UITapGestureRecognizer)?.numberOfTapsRequired == 1 } ?? false
            if taps { return false }
            v = current.superview
        }
        return true
    }
}

// MARK: - Views

final class PaddedLabel: UILabel {
    var insets = UIEdgeInsets.zero { didSet { invalidateIntrinsicContentSize() } }

    override init(frame: CGRect) {
        super.init(frame: frame)
        numberOfLines = 0
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func drawText(in rect: CGRect) { super.drawText(in: rect.inset(by: insets)) }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        let inner = CGSize(width: max(0, size.width - insets.left - insets.right), height: .greatestFiniteMagnitude)
        let fit = super.sizeThatFits(inner)
        return CGSize(width: fit.width + insets.left + insets.right, height: fit.height + insets.top + insets.bottom)
    }
}

final class NButton: UIControl {
    let label = PaddedLabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        label.isUserInteractionEnabled = false
        addSubview(label)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        label.frame = bounds
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize { label.sizeThatFits(size) }

    override var isHighlighted: Bool { didSet { label.alpha = isHighlighted ? 0.55 : 1 } }
}

final class PaddedTextField: UITextField {
    var insets = UIEdgeInsets.zero
    var onKey: (@MainActor (String) -> Void)?

    override func textRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func editingRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func placeholderRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }

    // Backspace reaches here from both keyboards; Enter is the field's own action (see Node.wireEvents).
    override func deleteBackward() {
        onKey?("Backspace")
        super.deleteBackward()
    }

    override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
        for press in presses {
            guard let key = press.key else { continue }
            if key.keyCode != .keyboardReturnOrEnter && key.keyCode != .keyboardDeleteOrBackspace { onKey?(keyName(key)) }
        }
        super.pressesBegan(presses, with: event)
    }
}

/// A container: a flex column (or row) of its node's child views.
final class FlexView: UIView {
    weak var node: Node?
    private(set) var items: [Node] = []

    // The last natural-height pass (width → size, frames): a parent measures a child, then gives it that size.
    private var memo: Flex.Result?
    private var memoWidth: CGFloat = -1
    private var memoFit = false

    /// Makes `next`'s views the subviews. Only views that arrive or leave are touched: layout places
    /// them in `items` order, so a move (a swap, a sort) is a new frame, not a reorder. The subview
    /// order is only the drawing order, so overlays drawn later stay on top.
    func setItems(_ next: [Node]) {
        let keep = Set(next.map { ObjectIdentifier($0) })
        for old in items where !keep.contains(ObjectIdentifier(old)) {
            if let v = old.view, v.superview === self { v.removeFromSuperview() }
        }
        for item in next {
            if let v = item.view, v.superview !== self { addSubview(v) }
        }
        items = next
        reorder()
        node?.invalidateLayout()
    }

    /// zIndex: subviews are drawn (and touched) in `items` order, lowest zIndex first.
    func reorder() {
        guard items.contains(where: { $0.computed.zIndex != nil }) else { return }
        let sorted = items.enumerated().sorted { a, b in
            let za = a.element.computed.zIndex ?? 0
            let zb = b.element.computed.zIndex ?? 0
            return za == zb ? a.offset < b.offset : za < zb
        }
        for entry in sorted {
            if let v = entry.element.view, v.superview === self { bringSubviewToFront(v) }
        }
    }

    override func setNeedsLayout() {
        memo = nil
        super.setNeedsLayout()
    }

    /// `fit`: the caller wants the width the content needs, not the width it offers.
    func measure(width: CGFloat, height: CGFloat?, fit: Bool) -> CGSize {
        if height == nil, let memo, memoWidth == width, memoFit || !fit { return memo.size }
        let result = Flex.layout(self, width: width, height: height, fit: fit)
        if height == nil {
            memo = result
            memoWidth = width
            memoFit = fit
        }
        return result.size
    }

    private var growsInColumn: Bool {
        node?.computed.flexDirection != .row && items.contains { ($0.computed.flex ?? 0) > 0 }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let size = bounds.size
        let frames: [Flex.Frame]
        // The size a parent measured, given back: the frames of that pass stand, unless a column shares free space (flex).
        if let memo, memoWidth == size.width, memo.size.height == size.height, !growsInColumn {
            frames = memo.frames
        } else {
            frames = Flex.layout(self, width: size.width, height: size.height, fit: false).frames
        }
        let scale = Runtime.shared.scale
        for f in frames {
            // Rounded edges, not sizes: neighbours meet exactly.
            let x = (f.rect.minX * scale).rounded() / scale
            let y = (f.rect.minY * scale).rounded() / scale
            let right = (f.rect.maxX * scale).rounded() / scale
            let bottom = (f.rect.maxY * scale).rounded() / scale
            f.node.place(CGRect(x: x, y: y, width: right - x, height: bottom - y))
        }
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize { measure(width: size.width, height: nil, fit: false) }

    /// As on Android, a box with no listener lets a touch through to what is behind it; an overlay
    /// box (absolute) takes the touches over what is under it.
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        guard hit === self, let node else { return hit }
        return node.touch != nil || node.computed.position == .absolute ? hit : nil
    }
}

/// An `overflow: "scroll"` box: the platform's scroller around the box's container. A column scrolls
/// vertically and a row horizontally; the content is at least as large as the box.
final class ScrollBox: UIScrollView, UIScrollViewDelegate {
    weak var node: Node?
    private let content: FlexView
    private let horizontal: Bool
    /// The size the content was last fitted for.
    private var fitted: CGSize?

    init(_ content: FlexView, horizontal: Bool) {
        self.content = content
        self.horizontal = horizontal
        super.init(frame: .zero)
        // The box is placed by its parent's layout: the safe area is the screen's business, not the box's.
        contentInsetAdjustmentBehavior = .never
        showsHorizontalScrollIndicator = false
        delegate = self
        addSubview(content)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func setNeedsLayout() {
        fitted = nil
        super.setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Scrolling lays out too: the content is only measured again when something changed.
        guard fitted != bounds.size else { return }
        fitted = bounds.size
        var size = bounds.size
        if horizontal {
            size.width = max(size.width, content.measure(width: Flex.unbounded * 2, height: size.height, fit: false).width)
        } else {
            size.height = max(size.height, content.measure(width: size.width, height: nil, fit: false).height)
        }
        if content.frame.size != size {
            content.frame = CGRect(origin: .zero, size: size)
            // The frame marked this view again: what was just fitted still stands.
            fitted = bounds.size
        }
        if contentSize != size { contentSize = size }
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        node?.onScroll?(
            ScrollEvent(
                scrollTop: Double(contentOffset.y), scrollLeft: Double(contentOffset.x),
                scrollHeight: Double(content.bounds.height), scrollWidth: Double(content.bounds.width),
                clientHeight: Double(bounds.height), clientWidth: Double(bounds.width)
            )
        )
    }
}

/// The flex layout every runtime implements the same way (see NucloRuntime.kt `Flex`). Sizes are
/// border boxes in points; a child's margins are added around its box. `flex` shares a line's free
/// space by weight (a column shares only a definite height); `flexWrap` breaks a row into lines;
/// nothing shrinks below its measured size.
@MainActor enum Flex {
    struct Frame {
        let node: Node
        var rect: CGRect
    }

    struct Result {
        var size: CGSize
        var frames: [Frame]
    }

    /// A width that is no limit: a row scrolling horizontally measures its content with it.
    static let unbounded = CGFloat.greatestFiniteMagnitude / 8

    /// Lays out `view`'s items in a box `width` wide (and `height` tall when definite). The size returned
    /// is the box's; with `fit`, its width is what the content needs (a box in a row, an absolute box),
    /// which for a column is its widest child before stretching.
    static func layout(_ view: FlexView, width: CGFloat, height: CGFloat?, fit: Bool) -> Result {
        let s = view.node?.computed ?? Style()
        let pad = s.insets
        let bounded = width < unbounded
        let innerW = bounded ? max(0, width - pad.left - pad.right) : width
        var innerH: CGFloat?
        if let height { innerH = max(0, height - pad.top - pad.bottom) }
        let flow = view.items.filter { $0.inFlow }
        var out = [CGRect](repeating: .zero, count: flow.count)
        let content: CGSize
        if s.flexDirection == .row {
            content = row(s, flow, innerW, innerH, pad, &out)
        } else {
            content = column(s, flow, innerW, innerH, pad, &out, fit)
        }
        let natural = CGSize(width: content.width + pad.left + pad.right, height: content.height + pad.top + pad.bottom)
        let w = bounded ? min(width, natural.width) : natural.width
        let h = height ?? natural.height

        var frames: [Frame] = []
        frames.reserveCapacity(view.items.count)
        for i in flow.indices { frames.append(Frame(node: flow[i], rect: out[i])) }
        // An absolute child is placed in the padding box, as in CSS.
        let b = CGFloat(s.borderWidth ?? 0)
        let boxW = (bounded ? width : natural.width) - 2 * b
        for child in view.items where child.computed.position == .absolute && child.computed.display != Display.none {
            let rect = absoluteFrame(child, boxW, h - 2 * b)
            frames.append(Frame(node: child, rect: rect.offsetBy(dx: b, dy: b)))
        }
        return Result(size: CGSize(width: w, height: h), frames: frames)
    }

    private static func crossAlign(_ s: Style, _ child: Style) -> Align {
        child.alignSelf ?? s.alignItems ?? .stretch
    }

    private static func clampHeight(_ h: CGFloat, _ s: Style) -> CGFloat {
        clamp(h, points(s.minHeight), points(s.maxHeight))
    }

    /// A row: one line, or several when it wraps. Returns the content size.
    private static func row(_ s: Style, _ flow: [Node], _ innerW: CGFloat, _ innerH: CGFloat?, _ pad: UIEdgeInsets, _ out: inout [CGRect]) -> CGSize {
        let n = flow.count
        let bounded = innerW < unbounded
        let gap = CGFloat(s.gap ?? 0)
        var margins: [UIEdgeInsets] = []
        var flexes: [CGFloat] = []
        var sizes: [CGSize] = []
        for child in flow {
            let m = child.computed.margins
            let grow: CGFloat = bounded ? CGFloat(child.computed.flex ?? 0) : 0
            margins.append(m)
            flexes.append(grow)
            if grow > 0 {
                sizes.append(.zero)
            } else {
                sizes.append(child.measure(maxWidth: bounded ? max(0, innerW - m.left - m.right) : innerW))
            }
        }
        // Lines: an item that does not fit after the ones before it starts the next line.
        let wrap = s.flexWrap == .wrap && bounded
        var starts: [Int] = n > 0 ? [0] : []
        if wrap {
            // Half a pixel of tolerance, as on Android.
            let slack = 0.5 / Runtime.shared.scale
            var used: CGFloat = 0
            for i in 0..<n {
                let w = sizes[i].width + margins[i].left + margins[i].right
                let lineStart = starts[starts.count - 1]
                if i > lineStart && used + gap + w > innerW + slack {
                    starts.append(i)
                    used = w
                } else {
                    used += (i > lineStart ? gap : 0) + w
                }
            }
        }
        let justify = s.justifyContent ?? .flexStart
        var y = pad.top
        var contentW: CGFloat = 0
        for li in starts.indices {
            let from = starts[li]
            let to = li + 1 < starts.count ? starts[li + 1] : n
            let count = CGFloat(to - from)
            var fixed = gap * (count - 1)
            var totalFlex: CGFloat = 0
            for i in from..<to {
                fixed += sizes[i].width + margins[i].left + margins[i].right
                totalFlex += flexes[i]
            }
            let space = bounded ? max(0, innerW - fixed) : 0
            if totalFlex > 0 {
                for i in from..<to where flexes[i] > 0 {
                    sizes[i] = flow[i].measure(maxWidth: space * flexes[i] / totalFlex, exact: true)
                }
            }
            var lineH: CGFloat = 0
            for i in from..<to { lineH = max(lineH, sizes[i].height + margins[i].top + margins[i].bottom) }
            if !wrap, let innerH { lineH = innerH }
            let free = totalFlex > 0 ? 0 : space
            var x = pad.left
            var spacing = gap
            switch justify {
            case .center: x += free / 2
            case .flexEnd: x += free
            case .spaceBetween: if count > 1 { spacing += free / (count - 1) }
            case .spaceAround:
                spacing += free / count
                x += free / count / 2
            case .spaceEvenly:
                spacing += free / (count + 1)
                x += free / (count + 1)
            case .flexStart: break
            }
            var lineW = gap * (count - 1)
            for i in from..<to {
                let m = margins[i]
                let cs = flow[i].computed
                let w = sizes[i].width
                var h = sizes[i].height
                var cy = y + m.top
                switch crossAlign(s, cs) {
                case .stretch: if cs.height == nil && cs.aspectRatio == nil { h = clampHeight(lineH - m.top - m.bottom, cs) }
                case .center: cy += (lineH - h - m.top - m.bottom) / 2
                case .flexEnd: cy += lineH - h - m.top - m.bottom
                case .flexStart: break
                }
                out[i] = CGRect(x: x + m.left, y: cy, width: w, height: h)
                x += w + m.left + m.right + spacing
                lineW += w + m.left + m.right
            }
            contentW = max(contentW, totalFlex > 0 ? innerW : lineW)
            y += lineH + (li + 1 < starts.count ? gap : 0)
        }
        return CGSize(width: contentW, height: y - pad.top)
    }

    /// A column. Returns the content size.
    private static func column(
        _ s: Style, _ flow: [Node], _ innerW: CGFloat, _ innerH: CGFloat?, _ pad: UIEdgeInsets, _ out: inout [CGRect], _ fit: Bool
    ) -> CGSize {
        let n = flow.count
        let bounded = innerW < unbounded
        let gap = CGFloat(s.gap ?? 0)
        let gaps = gap * CGFloat(max(0, n - 1))
        var margins: [UIEdgeInsets] = []
        var flexes: [CGFloat] = []
        var sizes: [CGSize] = []
        // What each child needs before stretching: the column's own width when it is asked to fit.
        var needs: [CGFloat] = []
        var totalFlex: CGFloat = 0
        var content = gaps
        for child in flow {
            let cs = child.computed
            let m = cs.margins
            let available = bounded ? max(0, innerW - m.left - m.right) : innerW
            // A stretched child is as wide as the column; one with its own width or alignment keeps its measure.
            let ownSize = cs.width != nil || (cs.aspectRatio != nil && cs.height != nil)
            let stretched = bounded && crossAlign(s, cs) == .stretch && !ownSize
            let size = child.measure(maxWidth: available, exact: stretched)
            needs.append(stretched && fit ? child.measure(maxWidth: available).width : size.width)
            let grow = CGFloat(cs.flex ?? 0)
            margins.append(m)
            flexes.append(grow)
            sizes.append(size)
            totalFlex += grow
            content += size.height + m.top + m.bottom
        }
        var free: CGFloat = 0
        if let innerH {
            if totalFlex > 0 {
                var basis = gaps
                for i in 0..<n { basis += margins[i].top + margins[i].bottom + (flexes[i] > 0 ? 0 : sizes[i].height) }
                let space = max(0, innerH - basis)
                for i in 0..<n where flexes[i] > 0 {
                    sizes[i].height = clampHeight(space * flexes[i] / totalFlex, flow[i].computed)
                }
            } else {
                free = max(0, innerH - content)
            }
        }
        let count = CGFloat(n)
        var y = pad.top
        var spacing = gap
        switch s.justifyContent ?? .flexStart {
        case .center: y += free / 2
        case .flexEnd: y += free
        case .spaceBetween: if n > 1 { spacing += free / (count - 1) }
        case .spaceAround:
            if n > 0 {
                spacing += free / count
                y += free / count / 2
            }
        case .spaceEvenly:
            spacing += free / (count + 1)
            y += free / (count + 1)
        case .flexStart: break
        }
        var contentW: CGFloat = 0
        for i in 0..<n {
            let m = margins[i]
            let w = sizes[i].width
            let h = sizes[i].height
            var x = pad.left + m.left
            if bounded {
                switch crossAlign(s, flow[i].computed) {
                case .center: x += (innerW - w - m.left - m.right) / 2
                case .flexEnd: x += innerW - w - m.left - m.right
                default: break
                }
            }
            y += m.top
            out[i] = CGRect(x: x, y: y, width: w, height: h)
            y += h + m.bottom + spacing
            contentW = max(contentW, (fit ? needs[i] : w) + m.left + m.right)
        }
        return CGSize(width: contentW, height: innerH ?? content)
    }

    private static func absoluteFrame(_ child: Node, _ bw: CGFloat, _ bh: CGFloat) -> CGRect {
        let s = child.computed
        let l = points(s.left)
        let r = points(s.right)
        let t = points(s.top)
        let b = points(s.bottom)
        let w: CGFloat
        if let own = points(s.width) {
            w = own
        } else if let l, let r {
            w = bw - l - r
        } else {
            w = child.measure(maxWidth: bw).width
        }
        let h: CGFloat
        if let own = points(s.height) {
            h = own
        } else if let t, let b {
            h = bh - t - b
        } else {
            h = child.measure(maxWidth: w, exact: true).height
        }
        var x: CGFloat = 0
        if let l { x = l } else if let r { x = bw - r - w }
        var y: CGFloat = 0
        if let t { y = t } else if let b { y = bh - b - h }
        return CGRect(x: x, y: y, width: w, height: h)
    }
}

/// A view the runtime sizes from outside the flex tree: a layout pass asked for below it stops here.
protocol ScreenRoot: UIView {}

/// A scrolling screen whose content is a node, as tall as its content or the screen.
final class ScreenView: UIScrollView, ScreenRoot {
    let root: Node

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        backgroundColor = .white
        alwaysBounceVertical = true
        keyboardDismissMode = .interactive
        if let v = root.view { addSubview(v) }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        let visible = bounds.height - adjustedContentInset.top - adjustedContentInset.bottom
        let size = CGSize(width: bounds.width, height: max(root.measure(maxWidth: bounds.width, exact: true).height, visible))
        root.place(CGRect(origin: .zero, size: size))
        if contentSize != size { contentSize = size }
    }
}

/// The screen of a root that is itself a scrolling box: the box fills the safe area and scrolls by itself.
final class FixedScreenView: UIView, ScreenRoot {
    let root: Node

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        backgroundColor = .white
        if let v = root.view { addSubview(v) }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        root.place(bounds.inset(by: safeAreaInsets))
    }
}

/// A layer over the app (a later render()): the size of the safe area, and touches go through where it shows nothing.
final class LayerView: UIView, ScreenRoot {
    let root: Node

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        if let v = root.view { addSubview(v) }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        root.place(bounds.inset(by: safeAreaInsets))
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        return hit === self ? nil : hit
    }
}

final class ScreenController: UIViewController {
    let root: Node
    private let header: Bool

    init(_ root: Node, title: String, header: Bool = true) {
        self.root = root
        self.header = header
        super.init(nibName: nil, bundle: nil)
        self.title = title
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func loadView() {
        if root.scrolls { view = FixedScreenView(root) } else { view = ScreenView(root) }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(!header, animated: animated)
    }
}

final class RootController: UIViewController {
    private var main: UIViewController?

    func setMain(_ controller: UIViewController) {
        if let main {
            main.willMove(toParent: nil)
            main.view.removeFromSuperview()
            main.removeFromParent()
        }
        main = controller
        addChild(controller)
        controller.view.frame = view.bounds
        controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.insertSubview(controller.view, at: 0)
        controller.didMove(toParent: self)
    }

    func addLayer(_ node: Node) {
        let layer = LayerView(node)
        layer.frame = view.bounds
        layer.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(layer)
    }
}

// MARK: - Runtime

@MainActor final class Runtime {
    static let shared = Runtime()

    let root = RootController()
    /// Pixels per point: frames are rounded to whole pixels.
    let scale = UIScreen.main.scale
    /// Counts update passes (see Node.born).
    private(set) var generation = 0
    /// forceUpdate(): every dynamic value is applied, changed or not.
    var forcing = false
    private var roots: [Node] = []
    private var hasMain = false
    private var updating = false
    private var queued: (all: Bool, ids: Set<String>)?
    /// Layout passes to animate once the update that asked for them is done (see Node.applyStyle).
    private var resizes: [(view: UIView, style: Style)] = []

    // Regions: id → region; into() entries waiting for their region.
    var regions: [String: RegionState] = [:]
    var waiting: [String: [IntoEntry]] = [:]

    func addRoot(_ node: Node) {
        roots.append(node)
        node.applyStylesDeep()
    }

    func removeRoot(_ node: Node) {
        roots.removeAll { $0 === node }
        node.destroy()
    }

    func render(_ node: Node) {
        addRoot(node)
        if hasMain {
            root.addLayer(node)
        } else {
            hasMain = true
            root.setMain(ScreenController(node, title: ""))
        }
    }

    func render(_ router: NRouter) {
        hasMain = true
        root.setMain(router.makeController())
    }

    func update(_ ids: [String]) {
        if updating {
            var q = queued ?? (false, [])
            if ids.isEmpty { q.all = true } else { q.ids.formUnion(ids) }
            queued = q
            return
        }
        updating = true
        run(ids)
        while let q = queued {
            queued = nil
            run(q.all ? [] : Array(q.ids))
        }
        updating = false
        let pending = resizes
        resizes = []
        for resize in pending { animate(resize.style) { resize.view.layoutIfNeeded() } }
    }

    private func run(_ ids: [String]) {
        generation += 1
        if ids.isEmpty {
            for node in roots { node.refresh() }
            return
        }
        let wanted = Set(ids)
        var found: [Node] = []
        func visit(_ node: Node) {
            if !node.scopes.isDisjoint(with: wanted) { found.append(node) } else { node.children.forEach(visit) }
        }
        roots.forEach(visit)
        for node in found { node.refresh() }
    }

    /// Animates the layout pass pending under `view` as the transition `style` describes: now, or
    /// after the update in progress, when every node has its new style.
    func animateLayout(_ view: UIView, _ style: Style) {
        if updating {
            resizes.append((view, style))
        } else {
            animate(style) { view.layoutIfNeeded() }
        }
    }
}

// MARK: - Builders

@MainActor private func build(_ kind: Node.Kind, _ tag: String, _ mods: [NodeMod?]) -> Node {
    let node = Node(kind, tag: tag)
    node.add(mods)
    node.finish()
    return node
}

@MainActor public func div(_ mods: NodeMod?...) -> Node { build(.box, "div", mods) }
@MainActor public func section(_ mods: NodeMod?...) -> Node { build(.box, "section", mods) }
@MainActor public func header(_ mods: NodeMod?...) -> Node { build(.box, "header", mods) }
@MainActor public func footer(_ mods: NodeMod?...) -> Node { build(.box, "footer", mods) }
@MainActor public func main(_ mods: NodeMod?...) -> Node { build(.box, "main", mods) }
@MainActor public func nav(_ mods: NodeMod?...) -> Node { build(.box, "nav", mods) }
@MainActor public func article(_ mods: NodeMod?...) -> Node { build(.box, "article", mods) }
@MainActor public func aside(_ mods: NodeMod?...) -> Node { build(.box, "aside", mods) }
@MainActor public func form(_ mods: NodeMod?...) -> Node { build(.box, "form", mods) }
@MainActor public func ul(_ mods: NodeMod?...) -> Node { build(.box, "ul", mods) }
@MainActor public func li(_ mods: NodeMod?...) -> Node { build(.box, "li", mods) }
@MainActor public func span(_ mods: NodeMod?...) -> Node { build(.text, "span", mods) }
@MainActor public func p(_ mods: NodeMod?...) -> Node { build(.text, "p", mods) }
@MainActor public func h1(_ mods: NodeMod?...) -> Node { build(.text, "h1", mods) }
@MainActor public func h2(_ mods: NodeMod?...) -> Node { build(.text, "h2", mods) }
@MainActor public func h3(_ mods: NodeMod?...) -> Node { build(.text, "h3", mods) }
@MainActor public func h4(_ mods: NodeMod?...) -> Node { build(.text, "h4", mods) }
@MainActor public func label(_ mods: NodeMod?...) -> Node { build(.text, "label", mods) }
@MainActor public func strong(_ mods: NodeMod?...) -> Node { build(.text, "strong", mods) }
@MainActor public func small(_ mods: NodeMod?...) -> Node { build(.text, "small", mods) }
@MainActor public func em(_ mods: NodeMod?...) -> Node { build(.text, "em", mods) }
@MainActor public func button(_ mods: NodeMod?...) -> Node { build(.button, "button", mods) }
@MainActor public func input(_ mods: NodeMod?...) -> Node { build(.input, "input", mods) }
@MainActor public func checkbox(_ mods: NodeMod?...) -> Node { build(.checkbox, "input", mods) }
@MainActor public func textarea(_ mods: NodeMod?...) -> Node { build(.textarea, "textarea", mods) }
@MainActor public func img(_ mods: NodeMod?...) -> Node { build(.image, "img", mods) }

/// Any other tag, by name: a text or a box, with the tag's default style.
@MainActor public func el(_ tag: String, _ mods: NodeMod?...) -> Node {
    build(textTags.contains(tag) ? .text : .box, tag, mods)
}

/// A platform view as a node: `component` makes it, and gets `props` again whenever a dynamic prop changed.
@MainActor public func nativeView<C: NativeComponent>(_ component: C, _ props: C.Props, _ mods: NodeMod?...) -> Node {
    let view = component.create()
    let node = Node(.native, tag: "native", native: view)
    node.nativeProps = props
    node.add(mods)
    let flush: @MainActor () -> Void = { [unowned node] in
        guard node.propsDirty else { return }
        node.propsDirty = false
        component.update(view, props)
        // UIKit does not pass a view's new size up by itself.
        node.invalidateLayout()
    }
    flush()
    node.bindings.append(flush)
    node.destroyCallbacks.append { component.destroy($0) }
    return node
}

/// An attribute: applied to the node it is given to.
public struct Attr: NodeMod {
    let run: @MainActor (Node) -> Void
    public func apply(to node: Node) { run(node) }
}

/// Attributes, the `{ … }` object of a nuclo builder call.
@MainActor public enum A {
    public static func text(_ value: String) -> NodeMod { Attr { $0.addText { value } } }
    public static func text(_ value: @escaping @MainActor () -> String) -> NodeMod { Attr { $0.addText(value) } }

    public static func style(_ value: Style) -> NodeMod { Attr { $0.inline = $0.inline.merged(value) } }
    public static func style(_ value: @escaping @MainActor () -> Style) -> NodeMod { Attr { $0.dynamicInline = value } }
    public static func className(_ value: StyleClass) -> NodeMod { value }
    public static func className(_ value: @escaping @MainActor () -> StyleClass) -> NodeMod { Attr { $0.dynamicClass = value } }

    public static func value(_ value: String) -> NodeMod { self.value { value } }
    public static func value(_ value: @escaping @MainActor () -> String) -> NodeMod {
        Attr { node in
            node.bind(value) { text in
                // Never reset what the user is typing to the same text (the caret would jump).
                if let field = node.view as? UITextField, field.text != text { field.text = text }
                if let textView = node.view as? UITextView, textView.text != text {
                    textView.text = text
                    node.invalidateLayout()
                }
            }
        }
    }

    public static func placeholder(_ value: String) -> NodeMod { placeholder { value } }
    public static func placeholder(_ value: @escaping @MainActor () -> String) -> NodeMod {
        Attr { node in node.bind(value) { (node.view as? UITextField)?.placeholder = $0 } }
    }

    public static func src(_ value: String) -> NodeMod { src { value } }
    public static func src(_ value: @escaping @MainActor () -> String) -> NodeMod {
        Attr { node in
            node.bind(value) { url in
                guard let image = node.view as? UIImageView, let u = URL(string: url) else { return }
                Task { @MainActor in
                    if let (data, _) = try? await URLSession.shared.data(from: u) { image.image = UIImage(data: data) }
                }
            }
        }
    }

    public static func href(_ value: String) -> NodeMod { href { value } }
    public static func href(_ value: @escaping @MainActor () -> String) -> NodeMod {
        Attr { node in
            node.bind(value) { node.href = $0 }
            node.enableClick()
        }
    }

    public static func ariaLabel(_ value: String) -> NodeMod { ariaLabel { value } }
    public static func ariaLabel(_ value: @escaping @MainActor () -> String) -> NodeMod {
        Attr { node in node.bind(value) { node.view?.accessibilityLabel = $0 } }
    }

    public static func checked(_ value: Bool) -> NodeMod { checked { value } }
    public static func checked(_ value: @escaping @MainActor () -> Bool) -> NodeMod {
        Attr { node in node.bind(value) { on in if let toggle = node.view as? UISwitch, toggle.isOn != on { toggle.setOn(on, animated: true) } } }
    }

    public static func disabled(_ value: Bool) -> NodeMod { disabled { value } }
    public static func disabled(_ value: @escaping @MainActor () -> Bool) -> NodeMod {
        Attr { node in node.bind(value) { node.setDisabled($0) } }
    }

    public static func inputType(_ type: String) -> NodeMod {
        Attr { node in
            guard let field = node.view as? UITextField else { return }
            field.isSecureTextEntry = type == "password"
            field.keyboardType = type == "email" ? .emailAddress : type == "number" ? .decimalPad : .default
            field.autocapitalizationType = type == "email" ? .none : .sentences
        }
    }

    /// A dynamic prop of a native component: `set` writes it into the node's props when it changed.
    public static func prop<P, T: Equatable>(_ get: @escaping @MainActor () -> T, _ set: @escaping @MainActor (P, T) -> Void) -> NodeMod {
        Attr { node in node.bind(get) { write(node, $0, set) } }
    }

    /// A prop whose values can't be compared (a list of objects) is written on every update.
    public static func prop<P, T>(_ get: @escaping @MainActor () -> T, _ set: @escaping @MainActor (P, T) -> Void) -> NodeMod {
        Attr { node in
            let run: @MainActor () -> Void = { [unowned node] in write(node, get(), set) }
            run()
            node.bindings.append(run)
        }
    }

    private static func write<P, T>(_ node: Node, _ value: T, _ set: @MainActor (P, T) -> Void) {
        guard let props = node.nativeProps as? P else { return }
        set(props, value)
        node.propsDirty = true
    }

    public static func onClick(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("click", handler) } }
    public static func onInput(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("input", handler) } }
    public static func onChange(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("change", handler) } }
    public static func onFocus(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("focus", handler) } }
    public static func onBlur(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("blur", handler) } }
    public static func onKeyDown(_ handler: @escaping @MainActor (KeyboardEvent) -> Void) -> NodeMod { Attr { $0.listenKeys(handler) } }

    public static func onPointerDown(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod {
        Attr { $0.touched()?.pointers["pointerDown"] = handler }
    }

    public static func onPointerMove(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod {
        Attr { $0.touched()?.pointers["pointerMove"] = handler }
    }

    public static func onPointerUp(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod {
        Attr { $0.touched()?.pointers["pointerUp"] = handler }
    }

    public static func onPointerCancel(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod {
        Attr { $0.touched()?.pointers["pointerCancel"] = handler }
    }

    public static func onLongPress(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod { Attr { $0.touched()?.longPress(handler) } }
    public static func onDoubleClick(_ handler: @escaping @MainActor (PointerEvent) -> Void) -> NodeMod { Attr { $0.touched()?.doubleClick(handler) } }
    public static func onPan(_ handler: @escaping @MainActor (PanEvent) -> Void) -> NodeMod { Attr { $0.touched()?.pan(handler) } }
    public static func onPinch(_ handler: @escaping @MainActor (PinchEvent) -> Void) -> NodeMod { Attr { $0.touched()?.pinch(handler) } }
    public static func onScroll(_ handler: @escaping @MainActor (ScrollEvent) -> Void) -> NodeMod { Attr { $0.onScroll = handler } }

    public static func onMount(_ handler: @escaping @MainActor (NativeElement) -> Cleanup?) -> NodeMod {
        Attr { node in
            node.mountCallbacks.append(handler)
            node.watchMount()
        }
    }

    public static func onDestroy(_ handler: @escaping @MainActor (NativeElement) -> Void) -> NodeMod {
        Attr { $0.destroyCallbacks.append(handler) }
    }
}

// MARK: - update(), scope(), render()

@MainActor public func update(_ scopeIds: String...) { Runtime.shared.update(scopeIds) }

@MainActor public func forceUpdate() {
    Runtime.shared.forcing = true
    Runtime.shared.update([])
    Runtime.shared.forcing = false
}

@MainActor public func scope(_ ids: String...) -> NodeMod { Attr { $0.scopes.formUnion(ids) } }

@MainActor public func render(_ view: @escaping @MainActor () -> Node) { Runtime.shared.render(view()) }

@MainActor public func render(_ router: NRouter) { Runtime.shared.render(router) }

// MARK: - list()

/// Rows keyed by identity (classes) as nuclo's list(): a row is rebuilt only when its item is new.
@MainActor public func list<T: AnyObject>(_ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment(items, render, key: { AnyHashable(ObjectIdentifier($0)) })
}

/// Rows keyed by value (strings, numbers).
@MainActor public func list<T: Hashable>(_ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment(items, render, key: { AnyHashable($0) })
}

@MainActor private func listFragment<T>(
    _ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?, key: @escaping (T) -> AnyHashable
) -> NodeMod {
    Attr { parent in
        let fragment = Node(.fragment, tag: "list")
        parent.append(fragment)
        var rows: [(item: T, node: Node?)] = []
        fragment.reconcile = { [unowned fragment] in
            let next = items()
            // Old rows by key, so matching is O(n): identity for classes, value otherwise.
            var byKey: [AnyHashable: [Int]] = [:]
            for (i, row) in rows.enumerated() { byKey[key(row.item), default: []].append(i) }
            var used = [Bool](repeating: false, count: rows.count)
            var fresh: [Node] = []
            var built: [(item: T, node: Node?)] = []
            built.reserveCapacity(next.count)
            var changed = next.count != rows.count
            for (index, item) in next.enumerated() {
                let k = key(item)
                if let i = byKey[k]?.first {
                    byKey[k]?.removeFirst()
                    used[i] = true
                    if i != index { changed = true }
                    built.append(rows[i])
                } else {
                    let node = render(item, index)
                    if let node {
                        node.parent = fragment
                        fresh.append(node)
                    }
                    built.append((item, node))
                    changed = true
                }
            }
            for (i, row) in rows.enumerated() where !used[i] { row.node?.destroy() }
            rows = built
            if changed {
                fragment.children = built.compactMap { $0.node }
                for node in fresh { node.applyStylesDeep() }
                fragment.syncViews()
            }
        }
        fragment.reconcile?()
    }
}

// MARK: - when()

@MainActor public final class WhenBuilder: NodeMod {
    private var branches: [(condition: @MainActor () -> Bool, content: Content)] = []
    private var otherwise: Content?

    init(_ condition: @escaping @MainActor () -> Bool, _ content: @escaping Content) { branches.append((condition, content)) }

    public func when(_ condition: @escaping @MainActor () -> Bool, _ content: @escaping Content) -> WhenBuilder {
        branches.append((condition, content))
        return self
    }

    public func when(_ condition: Bool, _ content: @escaping Content) -> WhenBuilder { when({ condition }, content) }

    public func `else`(_ content: @escaping Content) -> WhenBuilder {
        otherwise = content
        return self
    }

    public func apply(to parent: Node) {
        let fragment = Node(.fragment, tag: "when")
        parent.append(fragment)
        var active = -2
        let branches = self.branches
        let otherwise = self.otherwise
        fragment.reconcile = { [unowned fragment] in
            let next = branches.firstIndex { $0.condition() } ?? -1
            guard next != active else { return }
            active = next
            for child in fragment.children { child.destroy() }
            fragment.children = []
            if let content = next >= 0 ? branches[next].content : otherwise { fragment.add(content()) }
            for child in fragment.children { child.applyStylesDeep() }
            fragment.syncViews()
        }
        fragment.reconcile?()
    }
}

@MainActor public func when(_ condition: @escaping @MainActor () -> Bool, _ content: @escaping Content) -> WhenBuilder {
    WhenBuilder(condition, content)
}

@MainActor public func when(_ condition: Bool, _ content: @escaping Content) -> WhenBuilder { WhenBuilder({ condition }, content) }

// MARK: - region() / into()

@MainActor final class IntoEntry {
    let content: Content
    var holder: Node?
    init(_ content: @escaping Content) { self.content = content }
}

@MainActor final class RegionState {
    let fragment: Node
    let stack: Bool
    let empty: Content?
    var entries: [IntoEntry] = []
    var emptyHolder: Node?

    init(_ fragment: Node, stack: Bool, empty: Content?) {
        self.fragment = fragment
        self.stack = stack
        self.empty = empty
    }

    /// Shows the newest entry (or all of them, stacked), building only those not shown yet.
    func render() {
        let shown = stack ? entries : Array(entries.suffix(1))
        for entry in entries where !shown.contains(where: { $0 === entry }) {
            entry.holder?.destroy()
            entry.holder = nil
        }
        var children: [Node] = []
        for entry in shown {
            if entry.holder == nil {
                let holder = Node(.fragment, tag: "into")
                holder.parent = fragment
                holder.add(entry.content())
                entry.holder = holder
                holder.applyStylesDeep()
            }
            children.append(entry.holder!)
        }
        if children.isEmpty, let empty {
            if emptyHolder == nil {
                let holder = Node(.fragment, tag: "empty")
                holder.parent = fragment
                holder.add(empty())
                holder.applyStylesDeep()
                emptyHolder = holder
            }
            children = [emptyHolder!]
        } else {
            emptyHolder?.destroy()
            emptyHolder = nil
        }
        fragment.children = children
        fragment.syncViews()
    }
}

@MainActor public func region(_ id: String, type: String = "latest", empty: Content? = nil) -> NodeMod {
    Attr { parent in
        let fragment = Node(.fragment, tag: "region")
        parent.append(fragment)
        let state = RegionState(fragment, stack: type == "stack", empty: empty)
        let runtime = Runtime.shared
        runtime.regions[id] = state
        state.entries = runtime.waiting.removeValue(forKey: id) ?? []
        state.render()
        fragment.teardown.append {
            // The region goes: its views wait for the next region with this id.
            for entry in state.entries {
                entry.holder?.destroy()
                entry.holder = nil
            }
            if runtime.regions[id] === state { runtime.regions[id] = nil }
            runtime.waiting[id, default: []].append(contentsOf: state.entries)
        }
    }
}

@MainActor public func into(_ id: String, _ content: @escaping Content) -> NodeMod {
    Attr { parent in
        let anchor = Node(.fragment, tag: "into-anchor")
        parent.append(anchor)
        let entry = IntoEntry(content)
        let runtime = Runtime.shared
        if let region = runtime.regions[id] {
            region.entries.append(entry)
            region.render()
        } else {
            runtime.waiting[id, default: []].append(entry)
        }
        anchor.teardown.append {
            entry.holder?.destroy()
            entry.holder = nil
            if let region = runtime.regions[id], let i = region.entries.firstIndex(where: { $0 === entry }) {
                region.entries.remove(at: i)
                region.render()
            }
            runtime.waiting[id]?.removeAll { $0 === entry }
        }
    }
}

// MARK: - Router

@MainActor public final class NRoute {
    let parts: [String]
    let view: @MainActor (Params) -> Node
    let title: (@MainActor (Params) -> String)?
    let presentation: String
    let header: Bool

    public init(
        _ pattern: String, _ view: @escaping @MainActor (Params) -> Node, title: (@MainActor (Params) -> String)? = nil,
        presentation: String = "push", header: Bool = true
    ) {
        parts = pattern.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        self.view = view
        self.title = title
        self.presentation = presentation
        self.header = header
    }

    func match(_ path: String) -> Params? {
        let segments = path.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        guard segments.count == parts.count else { return nil }
        var params: Params = [:]
        for (pattern, segment) in zip(parts, segments) {
            if pattern.hasPrefix(":") { params[String(pattern.dropFirst())] = segment } else if pattern != segment { return nil }
        }
        return params
    }
}

public struct NTab {
    let path: String
    let title: String
    let icon: String
    public init(_ path: String, _ title: String, _ icon: String) { self.path = path; self.title = title; self.icon = icon }
}

/// Navigation stacks per tab, shown with UITabBarController and UINavigationController; a modal screen
/// is a sheet presented over them. The router owns the stacks: a native back (button, edge swipe, a
/// sheet swiped down) happens first and the router follows.
@MainActor public final class NRouter: NSObject, UINavigationControllerDelegate, UITabBarControllerDelegate, UIAdaptivePresentationControllerDelegate {
    struct Entry {
        let path: String
        let node: Node
        let controller: ScreenController
        let modal: Bool
    }

    private let routes: [NRoute]
    private let tabs: [NTab]
    private let initial: String
    private var stacks: [[Entry]] = []
    private var navigations: [UINavigationController] = []
    private var tabBar: UITabBarController?
    private var active = 0

    public init(routes: [NRoute], tabs: [NTab] = [], initial: String = "/") {
        self.routes = routes
        self.tabs = tabs
        self.initial = initial
    }

    public var outlet: NRouter { self }
    public var path: String { stacks.isEmpty ? initial : stacks[active].last?.path ?? initial }
    public var canGoBack: Bool { !stacks.isEmpty && stacks[active].count > 1 }

    func makeController() -> UIViewController {
        let roots = tabs.isEmpty ? [initial] : tabs.map { $0.path }
        active = max(0, tabOf(initial))
        for (i, rootPath) in roots.enumerated() {
            var stack = [entry(rootPath)]
            if i == active && rootPath != initial { stack.append(entry(initial)) }
            let navigation = UINavigationController(rootViewController: stack[0].controller)
            navigation.navigationBar.prefersLargeTitles = true
            navigation.delegate = self
            if stack.count > 1 {
                stack[1].controller.navigationItem.largeTitleDisplayMode = .never
                navigation.pushViewController(stack[1].controller, animated: false)
            }
            if i < tabs.count {
                let tab = tabs[i]
                navigation.tabBarItem = UITabBarItem(title: tab.title, image: UIImage(systemName: Self.symbol(tab.icon)), tag: i)
            }
            stacks.append(stack)
            navigations.append(navigation)
        }
        guard !tabs.isEmpty else { return navigations[0] }
        let tabBar = UITabBarController()
        tabBar.viewControllers = navigations
        tabBar.selectedIndex = active
        tabBar.delegate = self
        self.tabBar = tabBar
        return tabBar
    }

    public func go(_ path: String) {
        let e = entry(path)
        stacks[active].append(e)
        if e.modal {
            present(e, animated: true)
        } else {
            e.controller.navigationItem.largeTitleDisplayMode = .never
            navigations[active].pushViewController(e.controller, animated: true)
        }
        Runtime.shared.update([])
    }

    public func back() {
        guard canGoBack, let top = stacks[active].last else { return }
        if top.modal {
            stacks[active].removeLast()
            top.controller.presentingViewController?.dismiss(animated: true) { Runtime.shared.removeRoot(top.node) }
            Runtime.shared.update([])
        } else {
            // didShow drops the screen from the stack once it is gone.
            navigations[active].popViewController(animated: true)
        }
    }

    /// Replaces the current screen, without a transition.
    public func replace(_ path: String) {
        let gone = stacks[active].removeLast()
        let e = entry(path)
        stacks[active].append(e)
        if gone.modal { gone.controller.presentingViewController?.dismiss(animated: false) }
        if e.modal {
            present(e, animated: false)
        } else {
            if stacks[active].count > 1 { e.controller.navigationItem.largeTitleDisplayMode = .never }
            showStack()
        }
        Runtime.shared.removeRoot(gone.node)
        Runtime.shared.update([])
    }

    public func reset(_ path: String) {
        // No sheet survives a reset.
        if container.presentedViewController != nil { container.dismiss(animated: false) }
        for i in stacks.indices {
            for e in stacks[i] where e.modal { Runtime.shared.removeRoot(e.node) }
            stacks[i].removeAll { $0.modal }
        }
        let tab = tabOf(path)
        if tab >= 0 {
            active = tab
            tabBar?.selectedIndex = tab
        }
        let stack = stacks[active]
        let keep = stack[0].path == path ? stack[0] : entry(path)
        for e in stack where e.controller !== keep.controller { Runtime.shared.removeRoot(e.node) }
        stacks[active] = [keep]
        showStack()
        Runtime.shared.update([])
    }

    /// Makes the active navigation controller show the active stack's screens (its sheets are presented, not pushed).
    private func showStack() {
        navigations[active].setViewControllers(stacks[active].filter { !$0.modal }.map { $0.controller }, animated: false)
    }

    /// The controller render() shows: the tabs, or the only stack.
    private var container: UIViewController {
        if let tabBar { return tabBar }
        return navigations[0]
    }

    private func present(_ e: Entry, animated: Bool) {
        var top = container
        while let next = top.presentedViewController { top = next }
        e.controller.modalPresentationStyle = .pageSheet
        e.controller.presentationController?.delegate = self
        top.present(e.controller, animated: animated)
    }

    // The user went back natively (back button, edge swipe): drop the screens no longer shown.
    public func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard let i = navigations.firstIndex(of: navigationController) else { return }
        let shown = navigationController.viewControllers
        let gone = stacks[i].filter { !$0.modal && !shown.contains($0.controller) }
        guard !gone.isEmpty else { return }
        stacks[i].removeAll { e in gone.contains { $0.controller === e.controller } }
        for e in gone { Runtime.shared.removeRoot(e.node) }
        Runtime.shared.update([])
    }

    // The user swiped a sheet down.
    public func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        let dismissed = presentationController.presentedViewController
        for i in stacks.indices {
            for e in stacks[i] where e.controller === dismissed { Runtime.shared.removeRoot(e.node) }
            stacks[i].removeAll { $0.controller === dismissed }
        }
        Runtime.shared.update([])
    }

    public func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        active = tabBarController.selectedIndex
        Runtime.shared.update([])
    }

    private func entry(_ path: String) -> Entry {
        for route in routes {
            guard let params = route.match(path) else { continue }
            let node = route.view(params)
            Runtime.shared.addRoot(node)
            let controller = ScreenController(node, title: route.title?(params) ?? "", header: route.header)
            return Entry(path: path, node: node, controller: controller, modal: route.presentation == "modal")
        }
        let node = p(A.text("No route matches \(path)"))
        Runtime.shared.addRoot(node)
        return Entry(path: path, node: node, controller: ScreenController(node, title: "Not found"), modal: false)
    }

    private func tabOf(_ path: String) -> Int {
        var best = -1
        for (i, tab) in tabs.enumerated() {
            let owns = tab.path == "/" || path == tab.path || path.hasPrefix(tab.path + "/")
            if owns && (best < 0 || tab.path.count > tabs[best].path.count) { best = i }
        }
        return best
    }

    private static func symbol(_ icon: String) -> String {
        switch icon {
        case "home": return "house"
        case "list": return "checklist"
        case "cloud": return "cloud"
        case "star": return "star"
        case "person": return "person"
        case "settings": return "gearshape"
        case "chart": return "chart.bar"
        case "photo": return "photo"
        case "search": return "magnifyingglass"
        case "bell": return "bell"
        default: return "circle"
        }
    }
}

// MARK: - Async, timers, console

@MainActor public final class NResponse {
    public let status: Int
    public var ok: Bool { (200..<300).contains(status) }
    private let data: Data

    init(status: Int, data: Data) {
        self.status = status
        self.data = data
    }

    public func text() async throws -> String { String(decoding: data, as: UTF8.self) }

    public func json<T>(_ decode: @MainActor (Any?) throws -> T) async throws -> T {
        try decode(try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]))
    }
}

@MainActor public func fetch(_ url: String, method: String = "GET", body: String? = nil, headers: [String: String] = [:]) async throws -> NResponse {
    guard let u = URL(string: url) else { throw NError("Invalid URL: \(url)") }
    var request = URLRequest(url: u)
    request.httpMethod = method
    request.httpBody = body?.data(using: .utf8)
    for (key, value) in headers { request.setValue(value, forHTTPHeaderField: key) }
    let (data, response) = try await URLSession.shared.data(for: request)
    return NResponse(status: (response as? HTTPURLResponse)?.statusCode ?? 0, data: data)
}

public func delay(_ ms: Double) async throws {
    try await Task.sleep(nanoseconds: UInt64(max(0, ms) * 1_000_000))
}

@MainActor public final class NTimer {
    fileprivate var task: Task<Void, Never>?
    func cancel() { task?.cancel() }
}

@MainActor @discardableResult public func setTimeout(_ callback: @escaping @MainActor () -> Void, _ ms: Double) -> NTimer {
    let timer = NTimer()
    timer.task = Task { @MainActor in
        try? await Task.sleep(nanoseconds: UInt64(max(0, ms) * 1_000_000))
        if !Task.isCancelled { callback() }
    }
    return timer
}

@MainActor @discardableResult public func setInterval(_ callback: @escaping @MainActor () -> Void, _ ms: Double) -> NTimer {
    let timer = NTimer()
    timer.task = Task { @MainActor in
        while !Task.isCancelled {
            try? await Task.sleep(nanoseconds: UInt64(max(1, ms) * 1_000_000))
            if !Task.isCancelled { callback() }
        }
    }
    return timer
}

@MainActor public func clearTimeout(_ timer: NTimer) { timer.cancel() }
@MainActor public func clearInterval(_ timer: NTimer) { timer.cancel() }

/// One callback before the next frame. The display link keeps it alive until it ran or was cancelled.
@MainActor public final class NFrame: NSObject {
    private let callback: @MainActor (Double) -> Void
    private var link: CADisplayLink?

    init(_ callback: @escaping @MainActor (Double) -> Void) {
        self.callback = callback
        super.init()
        let link = CADisplayLink(target: self, selector: #selector(tick))
        link.add(to: .main, forMode: .common)
        self.link = link
    }

    @objc private func tick() {
        cancel()
        callback(jsNow())
    }

    func cancel() {
        link?.invalidate()
        link = nil
    }
}

/// Runs `callback` with the frame's time (as `Date.now()` counts it) before the next frame is drawn.
@MainActor @discardableResult public func requestAnimationFrame(_ callback: @escaping @MainActor (Double) -> Void) -> NFrame {
    NFrame(callback)
}

@MainActor public func cancelAnimationFrame(_ frame: NFrame) { frame.cancel() }

public func consoleLog(_ values: String...) { print(values.joined(separator: " ")) }

// MARK: - JSON

/// Decoders the compiler generates per interface call into these.
public enum NJSON {
    public static func object(_ v: Any?) throws -> [String: Any] {
        guard let o = v as? [String: Any] else { throw NError("Expected a JSON object") }
        return o
    }

    public static func string(_ v: Any?) throws -> String {
        guard let s = v as? String else { throw NError("Expected a JSON string") }
        return s
    }

    public static func double(_ v: Any?) throws -> Double {
        guard let n = v as? NSNumber else { throw NError("Expected a JSON number") }
        return n.doubleValue
    }

    public static func int(_ v: Any?) throws -> Int { Int(try double(v)) }

    public static func bool(_ v: Any?) throws -> Bool {
        guard let b = v as? Bool else { throw NError("Expected a JSON boolean") }
        return b
    }

    public static func array<T>(_ v: Any?, _ element: (Any?) throws -> T) throws -> [T] {
        guard let a = v as? [Any] else { throw NError("Expected a JSON array") }
        return try a.map(element)
    }

    public static func map<T>(_ v: Any?, _ value: (Any?) throws -> T) throws -> [String: T] {
        try object(v).mapValues(value)
    }

    public static func optional<T>(_ v: Any?, _ value: (Any?) throws -> T) throws -> T? {
        v == nil || v is NSNull ? nil : try value(v)
    }
}

// MARK: - JavaScript semantics

/// Numbers the way JavaScript prints them: 3, not 3.0.
public func jsNum(_ d: Double) -> String {
    if d.isFinite && d == d.rounded() && abs(d) < 1e15 { return String(Int(d)) }
    return d.isNaN ? "NaN" : d.isInfinite ? (d > 0 ? "Infinity" : "-Infinity") : String(d)
}

public func jsFixed(_ d: Double, _ digits: Int) -> String { String(format: "%.\(digits)f", d) }
public func jsRound(_ d: Double) -> Int { Int((d + 0.5).rounded(.down)) }
public func jsNow() -> Double { Date().timeIntervalSince1970 * 1000 }
public func jsNumber(_ s: String) -> Double { Double(s.trimmingCharacters(in: .whitespaces)) ?? .nan }
public func jsParseInt(_ s: String) -> Int { Int(s.trimmingCharacters(in: .whitespaces).prefix { $0.isNumber || $0 == "-" }) ?? 0 }
public func jsOr(_ a: String, _ b: String) -> String { a.isEmpty ? b : a }

public func jsErrorMessage(_ error: Error) -> String {
    let message = (error as? NError)?.message ?? error.localizedDescription
    return "Error: \(message)"
}

public extension Array {
    @discardableResult mutating func jsSplice(_ start: Int, _ count: Int) -> [Element] {
        let from = start < 0 ? Swift.max(0, self.count + start) : Swift.min(start, self.count)
        let to = Swift.min(self.count, from + Swift.max(0, count))
        let removed = Array(self[from..<to])
        removeSubrange(from..<to)
        return removed
    }

    @discardableResult mutating func jsPop() -> Element? { popLast() }

    /// `xs[i]` as JavaScript reads it: nil out of range instead of a trap.
    func jsAt(_ i: Int) -> Element? { indices.contains(i) ? self[i] : nil }

    func jsSlice(_ start: Int, _ end: Int?) -> [Element] {
        let n = count
        let from = start < 0 ? Swift.max(0, n + start) : Swift.min(start, n)
        let to = end.map { $0 < 0 ? Swift.max(0, n + $0) : Swift.min($0, n) } ?? n
        return from < to ? Array(self[from..<to]) : []
    }
}

public extension Array where Element: AnyObject {
    func jsIndexOf(_ item: Element) -> Int { firstIndex { $0 === item } ?? -1 }
    func jsIncludes(_ item: Element) -> Bool { contains { $0 === item } }
}

public extension Array where Element: Equatable {
    func jsIndexOf(_ item: Element) -> Int { firstIndex(of: item) ?? -1 }
    func jsIncludes(_ item: Element) -> Bool { contains(item) }
}

public extension String {
    func jsTrim() -> String { trimmingCharacters(in: .whitespacesAndNewlines) }

    func jsSlice(_ start: Int, _ end: Int?) -> String {
        let chars = Array(self)
        return String(chars.jsSlice(start, end))
    }
}

// MARK: - App delegate

/// The generated `AppDelegate` subclasses this and calls the app's entry point in `start()`.
@MainActor open class NucloAppDelegate: UIResponder, UIApplicationDelegate {
    public var window: UIWindow?

    open func start() {}

    public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = Runtime.shared.root
        window.makeKeyAndVisible()
        self.window = window
        start()
        return true
    }
}
