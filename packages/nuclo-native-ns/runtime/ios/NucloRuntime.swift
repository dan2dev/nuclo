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

#if canImport(UIKit)
import UIKit
import UIKit.UIGestureRecognizerSubclass

extension UIView {
    var cl: CALayer { layer }
    var parentView: UIView? { superview }
    var safeInsets: UIEdgeInsets { safeAreaInsets }
    var gestures: [UIGestureRecognizer]? { gestureRecognizers }
}
#else
import AppKit  // macOS: the UIKit names come from runtimes/macos/UIKitShim.swift
#endif

// MARK: - Types the generated code uses

public typealias Params = JsMap<String>
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

/// What a select reports when an option is picked: the event's target holds the option's value.
public func selectEvent(_ value: String) -> NativeEvent { NativeEvent(target: InputTarget(value: value, checked: false)) }

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

public struct NError: Error, LocalizedError, @unchecked Sendable {
    public let message: String
    /// "Error", or the class of an error the runtime throws as JavaScript would (`RangeError` of a BigInt division by 0).
    public var name = "Error"
    public init(_ message: String) { self.message = message }
    public init(name: String, _ message: String) { self.name = name; self.message = message }
    /// The object of an app's error class (`class E extends Error`) this error carries (`throw new E(…)`).
    public var obj: AnyObject? = nil
    public init(name: String, _ message: String, obj: AnyObject) { self.name = name; self.message = message; self.obj = obj }
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
public enum FontWeight: Hashable { case light, normal, medium, semibold, bold }
public enum FontStyle: Equatable { case normal, italic }
public enum TextAlign: Equatable { case left, center, right }
public enum TextDecoration: Equatable { case none, underline, lineThrough }
public enum Easing: Equatable { case linear, ease, easeIn, easeOut, easeInOut, spring }
public enum TextTransform: Equatable { case none, uppercase, lowercase, capitalize }
public enum ObjectFit: Equatable { case cover, contain, fill }
public enum PointerEvents: Equatable { case auto, none }

/// A style merged while the window's width is within `min`…`max` (`@media`, a theme's screens).
public struct MediaRule: Equatable {
    let min: Double?
    let max: Double?
    let style: Style
    public init(_ min: Double?, _ max: Double?, _ style: Style) { self.min = min; self.max = max; self.style = style }
    func matches(_ width: CGFloat) -> Bool { (min.map { Double(width) >= $0 } ?? true) && (max.map { Double(width) <= $0 } ?? true) }
}

/// A keyframes() stop: `at` in 0…1.
public struct KeyframeStop: Equatable {
    let at: Double
    let style: Style
    public init(_ at: Double, _ style: Style) { self.at = at; self.style = style }
}

/// A style's `animation`: keyframes, in milliseconds; `iterations` -1 runs forever.
public struct StyleAnimation: Equatable {
    let frames: [KeyframeStop]
    let duration: Double
    let delay: Double
    let easing: Easing
    let iterations: Int
    let alternate: Bool
    public init(_ frames: [KeyframeStop], _ duration: Double, _ delay: Double, _ easing: Easing, _ iterations: Int, _ alternate: Bool) {
        self.frames = frames; self.duration = duration; self.delay = delay; self.easing = easing; self.iterations = iterations; self.alternate = alternate
    }
}

/// A struct cannot contain itself: a style's state styles (`pressed`…) sit behind a reference.
final class StyleRef: Equatable {
    let style: Style
    init(_ style: Style) { self.style = style }
    static func == (a: StyleRef, b: StyleRef) -> Bool { a === b || a.style == b.style }
}

/// The style subset every runtime lays out the same way, in points. Parameters follow NATIVE_STYLE_KEYS (src/styleAliases.ts).
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
    public var widthPct: Double?
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
    public var borderTopWidth: Double?
    public var borderRightWidth: Double?
    public var borderBottomWidth: Double?
    public var borderLeftWidth: Double?
    public var borderTopColor: String?
    public var borderRightColor: String?
    public var borderBottomColor: String?
    public var borderLeftColor: String?
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
    public var textTransform: TextTransform?
    public var numberOfLines: Double?
    public var placeholderColor: String?
    public var objectFit: ObjectFit?
    public var pointerEvents: PointerEvents?
    public var translateX: Double?
    public var translateY: Double?
    public var scale: Double?
    public var rotate: Double?
    public var transitionDuration: Double?
    public var transitionDelay: Double?
    public var transitionEasing: Easing?
    public var animation: StyleAnimation?
    public var media: [MediaRule]?
    var pressedRef: StyleRef?
    var hoverRef: StyleRef?
    var focusedRef: StyleRef?
    var disabledRef: StyleRef?
    var enabledRef: StyleRef?
    var checkedRef: StyleRef?
    var placeholderShownRef: StyleRef?
    var firstRef: StyleRef?
    var lastRef: StyleRef?
    var onlyRef: StyleRef?
    var oddRef: StyleRef?
    var evenRef: StyleRef?
    var emptyRef: StyleRef?

    public var pressed: Style? { pressedRef?.style }
    public var hover: Style? { hoverRef?.style }
    public var focused: Style? { focusedRef?.style }
    public var disabled: Style? { disabledRef?.style }
    public var enabled: Style? { enabledRef?.style }
    public var checked: Style? { checkedRef?.style }
    public var placeholderShown: Style? { placeholderShownRef?.style }
    public var first: Style? { firstRef?.style }
    public var last: Style? { lastRef?.style }
    public var only: Style? { onlyRef?.style }
    public var odd: Style? { oddRef?.style }
    public var even: Style? { evenRef?.style }
    public var empty: Style? { emptyRef?.style }

    public init(
        flexDirection: FlexDirection? = nil, alignItems: Align? = nil, alignSelf: Align? = nil, justifyContent: Justify? = nil,
        flexWrap: FlexWrap? = nil, flex: Double? = nil, gap: Double? = nil, margin: Double? = nil, marginTop: Double? = nil,
        marginRight: Double? = nil, marginBottom: Double? = nil, marginLeft: Double? = nil, padding: Double? = nil,
        paddingTop: Double? = nil, paddingRight: Double? = nil, paddingBottom: Double? = nil, paddingLeft: Double? = nil,
        width: Double? = nil, widthPct: Double? = nil, height: Double? = nil, minWidth: Double? = nil, maxWidth: Double? = nil,
        minHeight: Double? = nil, maxHeight: Double? = nil, aspectRatio: Double? = nil, overflow: Overflow? = nil,
        position: Position? = nil, top: Double? = nil, right: Double? = nil, bottom: Double? = nil, left: Double? = nil,
        zIndex: Double? = nil, display: Display? = nil, backgroundColor: String? = nil, color: String? = nil,
        opacity: Double? = nil, borderRadius: Double? = nil, borderWidth: Double? = nil, borderColor: String? = nil,
        borderTopWidth: Double? = nil, borderRightWidth: Double? = nil, borderBottomWidth: Double? = nil,
        borderLeftWidth: Double? = nil, borderTopColor: String? = nil, borderRightColor: String? = nil,
        borderBottomColor: String? = nil, borderLeftColor: String? = nil, shadowColor: String? = nil,
        shadowRadius: Double? = nil, shadowOffsetX: Double? = nil, shadowOffsetY: Double? = nil, fontSize: Double? = nil,
        fontWeight: FontWeight? = nil, fontStyle: FontStyle? = nil, fontFamily: String? = nil, lineHeight: Double? = nil,
        letterSpacing: Double? = nil, textAlign: TextAlign? = nil, textDecoration: TextDecoration? = nil,
        textTransform: TextTransform? = nil, numberOfLines: Double? = nil, placeholderColor: String? = nil,
        objectFit: ObjectFit? = nil, pointerEvents: PointerEvents? = nil, translateX: Double? = nil, translateY: Double? = nil,
        scale: Double? = nil, rotate: Double? = nil, transitionDuration: Double? = nil, transitionDelay: Double? = nil,
        transitionEasing: Easing? = nil, animation: StyleAnimation? = nil, media: [MediaRule]? = nil, pressed: Style? = nil,
        hover: Style? = nil, focused: Style? = nil, disabled: Style? = nil, enabled: Style? = nil, checked: Style? = nil,
        placeholderShown: Style? = nil, first: Style? = nil, last: Style? = nil, only: Style? = nil, odd: Style? = nil,
        even: Style? = nil, empty: Style? = nil
    ) {
        self.flexDirection = flexDirection
        self.alignItems = alignItems
        self.alignSelf = alignSelf
        self.justifyContent = justifyContent
        self.flexWrap = flexWrap
        self.flex = flex
        self.gap = gap
        self.margin = margin
        self.marginTop = marginTop
        self.marginRight = marginRight
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.padding = padding
        self.paddingTop = paddingTop
        self.paddingRight = paddingRight
        self.paddingBottom = paddingBottom
        self.paddingLeft = paddingLeft
        self.width = width
        self.widthPct = widthPct
        self.height = height
        self.minWidth = minWidth
        self.maxWidth = maxWidth
        self.minHeight = minHeight
        self.maxHeight = maxHeight
        self.aspectRatio = aspectRatio
        self.overflow = overflow
        self.position = position
        self.top = top
        self.right = right
        self.bottom = bottom
        self.left = left
        self.zIndex = zIndex
        self.display = display
        self.backgroundColor = backgroundColor
        self.color = color
        self.opacity = opacity
        self.borderRadius = borderRadius
        self.borderWidth = borderWidth
        self.borderColor = borderColor
        self.borderTopWidth = borderTopWidth
        self.borderRightWidth = borderRightWidth
        self.borderBottomWidth = borderBottomWidth
        self.borderLeftWidth = borderLeftWidth
        self.borderTopColor = borderTopColor
        self.borderRightColor = borderRightColor
        self.borderBottomColor = borderBottomColor
        self.borderLeftColor = borderLeftColor
        self.shadowColor = shadowColor
        self.shadowRadius = shadowRadius
        self.shadowOffsetX = shadowOffsetX
        self.shadowOffsetY = shadowOffsetY
        self.fontSize = fontSize
        self.fontWeight = fontWeight
        self.fontStyle = fontStyle
        self.fontFamily = fontFamily
        self.lineHeight = lineHeight
        self.letterSpacing = letterSpacing
        self.textAlign = textAlign
        self.textDecoration = textDecoration
        self.textTransform = textTransform
        self.numberOfLines = numberOfLines
        self.placeholderColor = placeholderColor
        self.objectFit = objectFit
        self.pointerEvents = pointerEvents
        self.translateX = translateX
        self.translateY = translateY
        self.scale = scale
        self.rotate = rotate
        self.transitionDuration = transitionDuration
        self.transitionDelay = transitionDelay
        self.transitionEasing = transitionEasing
        self.animation = animation
        self.media = media
        self.pressedRef = pressed.map { StyleRef($0) }
        self.hoverRef = hover.map { StyleRef($0) }
        self.focusedRef = focused.map { StyleRef($0) }
        self.disabledRef = disabled.map { StyleRef($0) }
        self.enabledRef = enabled.map { StyleRef($0) }
        self.checkedRef = checked.map { StyleRef($0) }
        self.placeholderShownRef = placeholderShown.map { StyleRef($0) }
        self.firstRef = first.map { StyleRef($0) }
        self.lastRef = last.map { StyleRef($0) }
        self.onlyRef = only.map { StyleRef($0) }
        self.oddRef = odd.map { StyleRef($0) }
        self.evenRef = even.map { StyleRef($0) }
        self.emptyRef = empty.map { StyleRef($0) }
    }

    /// `o`'s set values win, as later declarations do in CSS; a shorthand (`padding`, `margin`, `borderWidth`, `borderColor`) resets the sides before it.
    public func merged(_ o: Style) -> Style {
        var s = self
        if o.padding != nil { s.paddingTop = nil; s.paddingRight = nil; s.paddingBottom = nil; s.paddingLeft = nil }
        if o.margin != nil { s.marginTop = nil; s.marginRight = nil; s.marginBottom = nil; s.marginLeft = nil }
        if o.borderWidth != nil { s.borderTopWidth = nil; s.borderRightWidth = nil; s.borderBottomWidth = nil; s.borderLeftWidth = nil }
        if o.borderColor != nil { s.borderTopColor = nil; s.borderRightColor = nil; s.borderBottomColor = nil; s.borderLeftColor = nil }
        s.flexDirection = o.flexDirection ?? s.flexDirection
        s.alignItems = o.alignItems ?? s.alignItems
        s.alignSelf = o.alignSelf ?? s.alignSelf
        s.justifyContent = o.justifyContent ?? s.justifyContent
        s.flexWrap = o.flexWrap ?? s.flexWrap
        s.flex = o.flex ?? s.flex
        s.gap = o.gap ?? s.gap
        s.margin = o.margin ?? s.margin
        s.marginTop = o.marginTop ?? s.marginTop
        s.marginRight = o.marginRight ?? s.marginRight
        s.marginBottom = o.marginBottom ?? s.marginBottom
        s.marginLeft = o.marginLeft ?? s.marginLeft
        s.padding = o.padding ?? s.padding
        s.paddingTop = o.paddingTop ?? s.paddingTop
        s.paddingRight = o.paddingRight ?? s.paddingRight
        s.paddingBottom = o.paddingBottom ?? s.paddingBottom
        s.paddingLeft = o.paddingLeft ?? s.paddingLeft
        s.width = o.widthPct != nil ? nil : o.width ?? s.width
        s.widthPct = o.width != nil ? nil : o.widthPct ?? s.widthPct
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
        s.borderTopWidth = o.borderTopWidth ?? s.borderTopWidth
        s.borderRightWidth = o.borderRightWidth ?? s.borderRightWidth
        s.borderBottomWidth = o.borderBottomWidth ?? s.borderBottomWidth
        s.borderLeftWidth = o.borderLeftWidth ?? s.borderLeftWidth
        s.borderTopColor = o.borderTopColor ?? s.borderTopColor
        s.borderRightColor = o.borderRightColor ?? s.borderRightColor
        s.borderBottomColor = o.borderBottomColor ?? s.borderBottomColor
        s.borderLeftColor = o.borderLeftColor ?? s.borderLeftColor
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
        s.textTransform = o.textTransform ?? s.textTransform
        s.numberOfLines = o.numberOfLines ?? s.numberOfLines
        s.placeholderColor = o.placeholderColor ?? s.placeholderColor
        s.objectFit = o.objectFit ?? s.objectFit
        s.pointerEvents = o.pointerEvents ?? s.pointerEvents
        s.translateX = o.translateX ?? s.translateX
        s.translateY = o.translateY ?? s.translateY
        s.scale = o.scale ?? s.scale
        s.rotate = o.rotate ?? s.rotate
        s.transitionDuration = o.transitionDuration ?? s.transitionDuration
        s.transitionDelay = o.transitionDelay ?? s.transitionDelay
        s.transitionEasing = o.transitionEasing ?? s.transitionEasing
        s.animation = o.animation ?? s.animation
        if let m = o.media { s.media = (s.media ?? []) + m }
        s.pressedRef = Style.mergedState(s.pressedRef, o.pressedRef)
        s.hoverRef = Style.mergedState(s.hoverRef, o.hoverRef)
        s.focusedRef = Style.mergedState(s.focusedRef, o.focusedRef)
        s.disabledRef = Style.mergedState(s.disabledRef, o.disabledRef)
        s.enabledRef = Style.mergedState(s.enabledRef, o.enabledRef)
        s.checkedRef = Style.mergedState(s.checkedRef, o.checkedRef)
        s.placeholderShownRef = Style.mergedState(s.placeholderShownRef, o.placeholderShownRef)
        s.firstRef = Style.mergedState(s.firstRef, o.firstRef)
        s.lastRef = Style.mergedState(s.lastRef, o.lastRef)
        s.onlyRef = Style.mergedState(s.onlyRef, o.onlyRef)
        s.oddRef = Style.mergedState(s.oddRef, o.oddRef)
        s.evenRef = Style.mergedState(s.evenRef, o.evenRef)
        s.emptyRef = Style.mergedState(s.emptyRef, o.emptyRef)
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
            lineHeight: lineHeight, letterSpacing: letterSpacing, textAlign: textAlign, textTransform: textTransform
        )
    }

    /// The border's width on each side: a side's own, or `borderWidth`.
    var borders: UIEdgeInsets {
        let b = borderWidth ?? 0
        return UIEdgeInsets(
            top: CGFloat(borderTopWidth ?? b), left: CGFloat(borderLeftWidth ?? b),
            bottom: CGFloat(borderBottomWidth ?? b), right: CGFloat(borderRightWidth ?? b)
        )
    }

    /// Whether every side has the same border: the layer's own border draws it, with the corners rounded.
    var uniformBorder: Bool {
        let b = borders
        let c = borderColor
        return b.top == b.left && b.top == b.bottom && b.top == b.right
            && (borderTopColor ?? c) == c && (borderRightColor ?? c) == c && (borderBottomColor ?? c) == c && (borderLeftColor ?? c) == c
    }

    /// Padding plus border.
    var insets: UIEdgeInsets {
        let b = borders
        return UIEdgeInsets(
            top: CGFloat(paddingTop ?? padding ?? 0) + b.top, left: CGFloat(paddingLeft ?? padding ?? 0) + b.left,
            bottom: CGFloat(paddingBottom ?? padding ?? 0) + b.bottom, right: CGFloat(paddingRight ?? padding ?? 0) + b.right
        )
    }

    /// `lineHeight` in points: a bare number under 4 is a multiple of the font size, as in CSS.
    var lineHeightPoints: CGFloat {
        let size = fontSize ?? 15
        guard let lh = lineHeight else { return CGFloat((size * 1.2).rounded()) }
        return CGFloat(lh < 4 ? (size * lh).rounded() : lh)
    }

    /// Whether the style changes with the box's place among its siblings.
    var structural: Bool { firstRef != nil || lastRef != nil || onlyRef != nil || oddRef != nil || evenRef != nil }

    var margins: UIEdgeInsets {
        UIEdgeInsets(
            top: CGFloat(marginTop ?? margin ?? 0), left: CGFloat(marginLeft ?? margin ?? 0),
            bottom: CGFloat(marginBottom ?? margin ?? 0), right: CGFloat(marginRight ?? margin ?? 0)
        )
    }

    var hasShadow: Bool { shadowRadius != nil || shadowColor != nil }

    /// What a plain UILabel has no property for: the text is then set as an attributed string.
    var richText: Bool {
        // Every label sets its line height (below), so every label is attributed.
        return true
    }

    /// The style without what only paints or transforms: two styles equal here give the same boxes.
    private var layoutOnly: Style {
        var s = self
        s.overflow = nil; s.backgroundColor = nil; s.color = nil; s.opacity = nil; s.borderRadius = nil; s.borderColor = nil
        s.shadowColor = nil; s.shadowRadius = nil; s.shadowOffsetX = nil; s.shadowOffsetY = nil
        s.textAlign = nil; s.textDecoration = nil
        s.borderTopColor = nil; s.borderRightColor = nil; s.borderBottomColor = nil; s.borderLeftColor = nil
        s.placeholderColor = nil; s.objectFit = nil; s.pointerEvents = nil; s.animation = nil; s.media = nil
        s.translateX = nil; s.translateY = nil; s.scale = nil; s.rotate = nil
        s.transitionDuration = nil; s.transitionDelay = nil; s.transitionEasing = nil
        s.pressedRef = nil; s.hoverRef = nil; s.focusedRef = nil; s.disabledRef = nil; s.enabledRef = nil; s.checkedRef = nil
        s.placeholderShownRef = nil; s.firstRef = nil; s.lastRef = nil; s.onlyRef = nil; s.oddRef = nil; s.evenRef = nil; s.emptyRef = nil
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

/// CSS colours: `#rgb(a)`, `#rrggbb(aa)`, `rgb()` / `rgba()`, `hsl()` / `hsla()`, `transparent` and the common names.
@MainActor private func parseColor(_ value: String?) -> UIColor? {
    guard let raw = value?.trimmingCharacters(in: .whitespaces).lowercased(), !raw.isEmpty else { return nil }
    if let cached = colorCache[raw] { return cached }
    let color = cssColor(raw)
    colorCache[raw] = color
    return color
}

@MainActor private var colorCache: [String: UIColor?] = [:]

private let namedColors: [String: String] = [
    "white": "#ffffff", "black": "#000000", "red": "#ff0000", "green": "#008000", "blue": "#0000ff", "yellow": "#ffff00",
    "orange": "#ffa500", "purple": "#800080", "pink": "#ffc0cb", "gray": "#808080", "grey": "#808080", "silver": "#c0c0c0",
    "navy": "#000080", "teal": "#008080", "maroon": "#800000", "olive": "#808000", "lime": "#00ff00", "aqua": "#00ffff",
    "cyan": "#00ffff", "fuchsia": "#ff00ff", "magenta": "#ff00ff", "indigo": "#4b0082", "violet": "#ee82ee", "brown": "#a52a2a",
    "gold": "#ffd700", "coral": "#ff7f50", "salmon": "#fa8072", "tomato": "#ff6347", "crimson": "#dc143c", "skyblue": "#87ceeb",
    "lightgray": "#d3d3d3", "lightgrey": "#d3d3d3", "darkgray": "#a9a9a9", "darkgrey": "#a9a9a9", "whitesmoke": "#f5f5f5",
]

private func cssColor(_ text: String) -> UIColor? {
    if text == "transparent" { return .clear }
    if let named = namedColors[text] { return cssColor(named) }
    if text.hasPrefix("rgb") || text.hasPrefix("hsl") {
        guard let open = text.firstIndex(of: "("), let close = text.lastIndex(of: ")") else { return nil }
        let parts = text[text.index(after: open)..<close].split(whereSeparator: { $0 == "," || $0 == " " || $0 == "/" }).map(String.init)
        guard parts.count >= 3 else { return nil }
        func number(_ part: String, _ full: Double) -> Double {
            part.hasSuffix("%") ? (Double(part.dropLast()) ?? 0) / 100 * full : Double(part.replacingOccurrences(of: "deg", with: "")) ?? 0
        }
        let alpha = parts.count > 3 ? CGFloat(number(parts[3], 1)) : 1
        if text.hasPrefix("rgb") {
            return UIColor(red: CGFloat(number(parts[0], 255) / 255), green: CGFloat(number(parts[1], 255) / 255), blue: CGFloat(number(parts[2], 255) / 255), alpha: alpha)
        }
        // HSL → RGB, as CSS defines it.
        let h = number(parts[0], 360), sat = number(parts[1], 1), l = number(parts[2], 1)
        func f(_ n: Double) -> CGFloat {
            let k = (n + h / 30).truncatingRemainder(dividingBy: 12)
            return CGFloat(l - sat * min(l, 1 - l) * max(-1, min(k - 3, 9 - k, 1)))
        }
        return UIColor(red: f(0), green: f(8), blue: f(4), alpha: alpha)
    }
    guard text.hasPrefix("#") else { return nil }
    var hex = String(text.dropFirst())
    if hex.count == 3 || hex.count == 4 { hex = hex.map { "\($0)\($0)" }.joined() }
    guard hex.count == 6 || hex.count == 8, let n = UInt64(hex, radix: 16) else { return nil }
    let rgba = hex.count == 6 ? (n << 8) | 0xff : n
    return UIColor(
        red: CGFloat((rgba >> 24) & 0xff) / 255, green: CGFloat((rgba >> 16) & 0xff) / 255,
        blue: CGFloat((rgba >> 8) & 0xff) / 255, alpha: CGFloat(rgba & 0xff) / 255
    )
}

/// globalStyle(): by tag name, and "body" for the screens and what every view inherits.
@MainActor var globalStyles: [String: Style] = [:] { didSet { globalStylesStamp += 1 } }
@MainActor var globalStylesStamp = 0
/// Bumped whenever some node's computed style changes: a node's static style merge stays valid
/// while its parent's stamp is the one it was merged against.
@MainActor var styleStamp = 0

@MainActor public func globalStyle(_ selector: String, _ style: Style) {
    for part in selector.split(separator: ",") {
        var tag = part.trimmingCharacters(in: .whitespaces)
        if tag == "html" || tag == ":root" || tag == "*" { tag = "body" }
        globalStyles[tag] = (globalStyles[tag] ?? Style()).merged(style)
    }
}

/// The screens' background: the body's, or white.
@MainActor var screenBackground: UIColor { parseColor(globalStyles["body"]?.backgroundColor) ?? .white }

private let textTags: Set<String> = [
    "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label", "strong", "b", "small", "em", "i", "u", "s", "del", "ins", "mark", "code",
    "pre", "kbd", "samp", "var", "abbr", "cite", "q", "dfn", "sub", "sup", "time", "legend", "caption", "figcaption", "summary", "dt", "dd", "a",
    "bdi", "bdo", "data", "output", "rt", "rp", "ruby",
]

/// What the browser (and nuclo-native) give each tag before any style, and what globalStyle() adds.
@MainActor private func tagStyle(_ tag: String) -> Style {
    let own = builtinTagStyle(tag)
    guard let global = globalStyles[tag] else { return own }
    return own.merged(global)
}

private func builtinTagStyle(_ tag: String) -> Style {
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
    case "head", "base", "link", "meta", "script", "style", "title", "template", "noscript", "datalist", "area", "source", "track", "wbr": return Style(display: Display.none)
    case "br": return Style(height: 16)
    case "select": return Style(overflow: .hidden, backgroundColor: "#ffffff", borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1")
    case "progress": return Style(flexDirection: .row, width: 160, height: 16, overflow: .hidden, backgroundColor: "#e5e7eb", borderRadius: 8)
    case "meter": return Style(flexDirection: .row, width: 80, height: 16, overflow: .hidden, backgroundColor: "#e5e7eb", borderRadius: 8)
    case "button": return Style(paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14, color: "#2563eb")
    case "input", "textarea": return Style(padding: 8)
    default: return Style()
    }
}

/// UIKit's initializer is not optional and AppKit's is.
private func makeFont(_ descriptor: UIFontDescriptor, _ size: CGFloat) -> UIFont? { UIFont(descriptor: descriptor, size: size) }

private struct FontKey: Hashable { let size: Double?, weight: FontWeight?, family: String?, italic: Bool }
@MainActor private var fontCache: [FontKey: UIFont] = [:]

/// The style's font, made once per size, weight, family and slant.
@MainActor private func textFont(_ s: Style) -> UIFont {
    let key = FontKey(size: s.fontSize, weight: s.fontWeight, family: s.fontFamily, italic: s.fontStyle == .italic)
    if let font = fontCache[key] { return font }
    let font = makeTextFont(s)
    fontCache[key] = font
    return font
}

private func makeTextFont(_ s: Style) -> UIFont {
    let size = CGFloat(s.fontSize ?? 15)
    let weight: UIFont.Weight
    switch s.fontWeight ?? .normal {
    case .light: weight = .light
    case .normal: weight = .regular
    case .medium: weight = .medium
    case .semibold: weight = .semibold
    case .bold: weight = .bold
    }
    let system = UIFont.systemFont(ofSize: size, weight: weight)
    let family = s.fontFamily ?? "sans-serif"
    var font = system
    var traits: UIFontDescriptor.SymbolicTraits = []
    #if canImport(UIKit)
    let bold = UIFontDescriptor.SymbolicTraits.traitBold, italic = UIFontDescriptor.SymbolicTraits.traitItalic
    #else
    let bold = UIFontDescriptor.SymbolicTraits.bold, italic = UIFontDescriptor.SymbolicTraits.italic
    #endif
    if family == "monospace" {
        font = .monospacedSystemFont(ofSize: size, weight: weight)
    } else if family == "serif" {
        if let serif = system.fontDescriptor.withDesign(.serif), let f = makeFont(serif, size) { font = f }
    } else if family != "sans-serif", let named = UIFont(name: family, size: size) {
        font = named
        if s.fontWeight == .bold || s.fontWeight == .semibold { traits.insert(bold) }
    }
    if s.fontStyle == .italic { traits.insert(italic) }
    guard !traits.isEmpty else { return font }
    let descriptor = font.fontDescriptor
    #if canImport(UIKit)
    guard let styled = descriptor.withSymbolicTraits(descriptor.symbolicTraits.union(traits)) else { return font }
    #else
    let styled = descriptor.withSymbolicTraits(descriptor.symbolicTraits.union(traits))
    #endif
    return makeFont(styled, size) ?? font
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

    var classes: [Style] = [] { didSet { staleBase() } }
    var dynamicClass: (@MainActor () -> StyleClass)? { didSet { staleBase() } }
    /// Behind a reference: most nodes have none, and a Style is over a kilobyte inline.
    private var inlineRef: StyleRef?
    var inline: Style {
        get { inlineRef?.style ?? Style() }
        set {
            inlineRef = StyleRef(newValue)
            staleBase()
        }
    }
    var dynamicInline: (@MainActor () -> Style)? { didSet { staleBase() } }
    private(set) var computed = Style()
    /// Changes whenever `computed` does (see styleStamp).
    private(set) var computedStamp = 0
    /// The static part of the style (inherited, tag, classes, inline) of a node with a dynamic style,
    /// merged against the parent's `computedStamp` and `globalStylesStamp` in `baseFrom`.
    private var baseRef: StyleRef?
    private var baseFrom = (-1, -1)
    /// The last applyStyle depended on nothing but the static part: refresh() can skip it while
    /// `baseFrom` holds.
    private var staticStyle = false
    private func staleBase() {
        baseRef = nil
        baseFrom = (-2, -2)
    }
    /// The last style painted: `computed`, once there is one.
    private var hasPainted = false
    private var painted: Style? { hasPainted ? computed : nil }
    /// The frame the parent's layout gave.
    private var placed: CGRect?
    /// The last text measure: available width → size.
    private var textMeasure: (width: CGFloat, size: CGSize)?

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

    /// A screen that scrolls itself: its root is a scroller, or has one as a child (a chat's thread over a
    /// fixed composer, a list under a header that stays). The page around it does not scroll then.
    var scrollsItself: Bool {
        scrolls || (flex != nil && children.flatMap { $0.flatViews }.contains { $0.scrolls && ($0.view as? ScrollBox)?.isVertical == true })
    }

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
            v = current.parentView
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
        // Before the first paint, the paint sets the text (with its style) itself.
        if painted != nil { setText() }
        invalidateLayout()
    }

    private var label: PaddedLabel? { (view as? PaddedLabel) ?? (view as? NButton)?.label }

    /// Writes the text into the label: plain, or with the attributes a UILabel has no property for.
    private func setText() {
        textMeasure = nil
        guard let label else { return }
        let text = transformed(lastText ?? "")
        guard rich else {
            label.text = text
            return
        }
        let s = computed
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = label.textAlignment
        if s.numberOfLines != nil { paragraph.lineBreakMode = .byTruncatingTail }
        // Every runtime sets a line 1.2 times its font size, in whole points, unless the style says otherwise.
        let lineHeight = s.lineHeightPoints
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
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

    /// `textTransform`, as CSS applies it.
    private func transformed(_ text: String) -> String {
        switch computed.textTransform ?? TextTransform.none {
        case .none: return text
        case .uppercase: return text.uppercased()
        case .lowercase: return text.lowercased()
        case .capitalize: return text.split(separator: " ", omittingEmptySubsequences: false).map { $0.prefix(1).uppercased() + $0.dropFirst() }.joined(separator: " ")
        }
    }

    // MARK: Refresh

    func refresh() {
        guard !destroyed, born != Runtime.shared.generation else { return }
        reconcile?()
        for binding in bindings { binding() }
        if !(staticStyle && baseFrom == (parent?.computedStamp ?? -1, globalStylesStamp) && !Runtime.shared.forcing) { applyStyle() }
        for child in children { child.refresh() }
    }

    func applyStylesDeep() {
        applyStyle()
        for child in children { child.applyStylesDeep() }
    }

    func applyStyle() {
        guard let view else {
            computed = parent?.computed ?? Style()
            computedStamp = parent?.computedStamp ?? -1
            return
        }
        // The static part is merged once per parent style: an update then costs the dynamic merges only.
        let from = (parent?.computedStamp ?? -1, globalStylesStamp)
        let dynamic = dynamicClass != nil || dynamicInline != nil
        var s: Style
        if let baseRef, dynamic, baseFrom == from {
            s = baseRef.style
        } else {
            let root = parent == nil ? (globalStyles["body"]?.inherited ?? Style()) : Style()
            s = (parent?.computed.inherited ?? root).merged(tagStyle(tag))
            for c in classes { s = s.merged(c) }
            if dynamicClass == nil, let inlineRef { s = s.merged(inlineRef.style) }
            baseRef = dynamic ? StyleRef(s) : nil
            baseFrom = from
        }
        if let dynamicClass {
            s = s.merged(dynamicClass().style)
            if let inlineRef { s = s.merged(inlineRef.style) }
        }
        if let dynamicInline { s = s.merged(dynamicInline()) }
        staticStyle = dynamicClass == nil && dynamicInline == nil && s.media == nil && !s.structural && s.empty == nil && s.checked == nil
            && s.placeholderShown == nil && s.disabled == nil && s.enabled == nil && s.hover == nil && s.focused == nil && s.pressed == nil
        // `@media` and screens, against the window's width.
        if let media = s.media {
            Runtime.shared.usesMedia = true
            for rule in media where rule.matches(Runtime.shared.viewportWidth) { s = s.merged(rule.style) }
        }
        // The box's place among its siblings, and what it holds.
        if s.structural, let (index, count) = siblingPlace() {
            if index == 0, let first = s.first { s = s.merged(first) }
            if index == count - 1, let last = s.last { s = s.merged(last) }
            if count == 1, let only = s.only { s = s.merged(only) }
            if index % 2 == 0, let odd = s.odd { s = s.merged(odd) }
            if index % 2 == 1, let even = s.even { s = s.merged(even) }
        }
        if let empty = s.empty, isEmpty { s = s.merged(empty) }
        if let checked = s.checked, (view as? UISwitch)?.isOn == true { s = s.merged(checked) }
        if let shown = s.placeholderShown, fieldText?.isEmpty == true { s = s.merged(shown) }
        if disabledNow, let disabled = s.disabled { s = s.merged(disabled) }
        if !disabledNow, let enabled = s.enabled { s = s.merged(enabled) }
        if s.hover != nil { touched()?.watchHover() }
        if hoveredNow, let hover = s.hover { s = s.merged(hover) }
        if focusedNow, let focused = s.focused { s = s.merged(focused) }
        if s.pressed != nil { _ = touched() }
        if pressedNow, let pressed = s.pressed { s = s.merged(pressed) }
        let before = painted
        if s == before && !Runtime.shared.forcing { return }
        computed = s
        hasPainted = true
        styleStamp += 1
        computedStamp = styleStamp
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

    /// This view's index among the views of its container, and how many there are.
    private func siblingPlace() -> (Int, Int)? {
        guard let host else { return nil }
        let views = host.children.flatMap { $0.flatViews }
        guard let index = views.firstIndex(where: { $0 === self }) else { return nil }
        return (index, views.count)
    }

    /// `:empty`: a box with no views, a text with no text.
    private var isEmpty: Bool { flex != nil ? children.flatMap { $0.flatViews }.isEmpty : (lastText ?? "").isEmpty }

    private var fieldText: String? { (view as? UITextField)?.text ?? (view as? UITextView)?.text }

    private func paint(_ view: UIView, _ s: Style, _ before: Style?) {
        textMeasure = nil
        let clips = s.overflow == .hidden || s.overflow == .scroll
        // A scroller (and a textarea, which is one) always clips its content; a label paints its own background,
        // which only a clip rounds.
        view.clipsToBounds = clips || kind == .image || view is UIScrollView || (view is UILabel && (s.borderRadius ?? 0) > 0)
        view.isHidden = s.display == Display.none
        if s.pointerEvents == PointerEvents.none { view.isUserInteractionEnabled = false } else if touch != nil || kind != .text { view.isUserInteractionEnabled = true }
        if let image = view as? UIImageView {
            image.contentMode = s.objectFit == .contain ? .scaleAspectFit : s.objectFit == .fill ? .scaleToFill : .scaleAspectFill
        }
        if s.uniformBorder {
            view.cl.borderWidth = s.borders.top
            view.cl.borderColor = (parseColor(s.borderColor) ?? UIColor.black).cgColor
            sideBorders?.forEach { $0.removeFromSuperlayer() }
            sideBorders = nil
        } else {
            view.cl.borderWidth = 0
            paintSideBorders(view, s)
        }
        if s.animation != before?.animation { runAnimation(view, s) }
        if s.hasShadow {
            // As CSS: the colour carries the shadow's alpha, and the blur radius is twice the layer's (a standard deviation).
            view.cl.shadowColor = (parseColor(s.shadowColor) ?? UIColor(white: 0, alpha: 0.25)).cgColor
            view.cl.shadowOpacity = 1
            view.cl.shadowRadius = CGFloat(s.shadowRadius ?? 0) / 2
            view.cl.shadowOffset = CGSize(width: CGFloat(s.shadowOffsetX ?? 0), height: CGFloat(s.shadowOffsetY ?? 0))
        } else {
            view.cl.shadowOpacity = 0
        }
        shadowPath()

        let background = parseColor(s.backgroundColor) ?? UIColor.clear
        let alpha = CGFloat(s.opacity ?? 1) * (disabledNow ? 0.4 : 1)
        let transform = boxTransform(s)
        // A radius past half the box is a pill, as in CSS.
        let radius = min(CGFloat(s.borderRadius ?? 0), placed.map { min($0.width, $0.height) / 2 } ?? .greatestFiniteMagnitude)
        let changes = {
            view.backgroundColor = background
            view.alpha = alpha
            view.transform = transform
            view.cl.cornerRadius = radius
        }
        // A transition animates what changed since the last paint; the first paint is applied at once.
        if before != nil && (s.transitionDuration ?? 0) > 0 {
            animate(s, changes)
        } else {
            // A transition still running (a card springing back, grabbed again) must not add to the new values.
            if (before?.transitionDuration ?? 0) > 0 { view.cl.removeAllAnimations() }
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
            field.placeholderColor = parseColor(s.placeholderColor)
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

    /// The sides' borders when they differ: a layer per side, over the content.
    private var sideBorders: [CALayer]?

    private func paintSideBorders(_ view: UIView, _ s: Style) {
        let layers = sideBorders ?? (0..<4).map { _ in
            let layer = CALayer()
            layer.zPosition = 1000
            view.cl.addSublayer(layer)
            return layer
        }
        sideBorders = layers
        let colors = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor]
        for (layer, color) in zip(layers, colors) {
            layer.backgroundColor = (parseColor(color ?? s.borderColor) ?? UIColor.black).cgColor
        }
        layoutSideBorders()
    }

    private func layoutSideBorders() {
        guard let sideBorders, let view else { return }
        let b = computed.borders
        let size = view.bounds.size
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        sideBorders[0].frame = CGRect(x: 0, y: 0, width: size.width, height: b.top)
        sideBorders[1].frame = CGRect(x: size.width - b.right, y: 0, width: b.right, height: size.height)
        sideBorders[2].frame = CGRect(x: 0, y: size.height - b.bottom, width: size.width, height: b.bottom)
        sideBorders[3].frame = CGRect(x: 0, y: 0, width: b.left, height: size.height)
        CATransaction.commit()
    }

    /// A style's keyframes animation, on the layer: opacity, transform and background colour, frame by frame.
    private func runAnimation(_ view: UIView, _ s: Style) {
        view.cl.removeAnimation(forKey: "nuclo.animation")
        guard let anim = s.animation, !anim.frames.isEmpty, anim.duration > 0 else { return }
        let times = anim.frames.map { NSNumber(value: $0.at) }
        let at = anim.frames.map { s.merged($0.style) }
        var animations: [CAAnimation] = []
        func track(_ key: String, _ values: [Any]) {
            let a = CAKeyframeAnimation(keyPath: key)
            a.values = values
            a.keyTimes = times
            animations.append(a)
        }
        if anim.frames.contains(where: { $0.style.opacity != nil }) { track("opacity", at.map { NSNumber(value: $0.opacity ?? 1) }) }
        if anim.frames.contains(where: { $0.style.translateX != nil || $0.style.translateY != nil || $0.style.scale != nil || $0.style.rotate != nil }) {
            track("transform", at.map { NSValue(caTransform3D: CATransform3DMakeAffineTransform(boxTransform($0))) })
        }
        if anim.frames.contains(where: { $0.style.backgroundColor != nil }) {
            track("backgroundColor", at.map { (parseColor($0.backgroundColor) ?? UIColor.clear).cgColor })
        }
        let group = CAAnimationGroup()
        group.animations = animations
        group.duration = anim.duration / 1000
        group.beginTime = CACurrentMediaTime() + anim.delay / 1000
        group.autoreverses = anim.alternate
        let count = anim.iterations < 0 ? Float.infinity : Float(anim.iterations)
        group.repeatCount = anim.alternate ? count / 2 : count
        let names: [Easing: CAMediaTimingFunctionName] = [.linear: .linear, .easeIn: .easeIn, .easeOut: .easeOut, .easeInOut: .easeInEaseOut]
        group.timingFunction = CAMediaTimingFunction(name: names[anim.easing] ?? .default)
        view.cl.add(group, forKey: "nuclo.animation")
    }

    /// The layer's shadow is cast by the box (rounded as it is), not by whatever its content draws.
    private func shadowPath() {
        guard let view else { return }
        view.cl.shadowPath = computed.hasShadow
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
        if sideBorders != nil { layoutSideBorders() }
        // The pill radius depends on the size.
        if let r = computed.borderRadius, CGFloat(r) * 2 > min(next.width, next.height) { view.cl.cornerRadius = min(CGFloat(r), min(next.width, next.height) / 2) }
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
        // States that follow what the user did to the control.
        if (type == "input" && computed.placeholderShown != nil) || (type == "change" && computed.checked != nil) { applyStyle() }
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
        if computed.disabled != nil || computed.enabled != nil { applyStyle() }
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
        var width = points(s.width) ?? s.widthPct.flatMap { maxWidth < Flex.unbounded ? maxWidth * CGFloat($0) / 100 : nil }
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
            // A switch on iOS; on a Mac a checkbox, the size a browser gives one.
            #if canImport(UIKit)
            size = CGSize(width: 51, height: 31)
            #else
            size = CGSize(width: 20, height: 20)
            #endif
        } else if view is UIImageView {
            size = CGSize(width: min(available, 120), height: height ?? width ?? 120)
        } else if let field = view as? PaddedTextField {
            // One line of the style's line height inside the padding, as the web's field.
            size = CGSize(width: min(available, 180), height: computed.lineHeightPoints + field.insets.top + field.insets.bottom)
        } else {
            // A label or button is measured again only when its text, its style or the width changed.
            let fit: CGSize
            if let m = textMeasure, m.width == available, kind == .text || kind == .button {
                fit = m.size
            } else {
                fit = view.sizeThatFits(CGSize(width: available, height: CGFloat.greatestFiniteMagnitude))
                textMeasure = (available, fit)
            }
            // Up to the device pixel, as a browser places text: whole points would put every box after it up to a point off.
            let scale = Runtime.shared.scale
            size = CGSize(width: min((fit.width * scale).rounded(.up) / scale, available), height: fit.height.rounded(.up))
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
    /// nuclo-native-ns: "x", "y", or "both": a pan on one axis does not begin along the other (the scroller takes it).
    var axis = "both"
    private var panRecognizer: UIPanGestureRecognizer?

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
        panRecognizer = g
    }

    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard gestureRecognizer === panRecognizer, axis != "both", let pan = panRecognizer else { return true }
        let v = pan.velocity(in: view)
        return axis == "x" ? abs(v.x) > abs(v.y) : abs(v.y) > abs(v.x)
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
        guard g.state == .began, let handler = pointers["longPress"] else { return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        handler(pointer(g))
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
            let taps = current.gestures?.contains { ($0 as? UITapGestureRecognizer)?.numberOfTapsRequired == 1 } ?? false
            if taps { return false }
            v = current.parentView
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
    /// `placeholderColor` / `::placeholder`: the placeholder is written in it.
    var placeholderColor: UIColor? { didSet { if placeholderColor != oldValue { colorPlaceholder() } } }
    override var placeholder: String? { didSet { colorPlaceholder() } }

    private func colorPlaceholder() {
        guard let placeholderColor, let text = placeholder else { return }
        attributedPlaceholder = NSAttributedString(string: text, attributes: [.foregroundColor: placeholderColor, .font: font ?? UIFont.systemFont(ofSize: 15)])
    }

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
        let moved = items.map { ObjectIdentifier($0) } != next.map { ObjectIdentifier($0) }
        items = next
        reorder()
        node?.invalidateLayout()
        // `:first-child`, `:odd`…: the places changed.
        if moved { for item in next where item.computed.structural { item.applyStyle() } }
        if moved, node?.computed.empty != nil { node?.applyStyle() }
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
    var isVertical: Bool { !horizontal }
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
            let ownSize = cs.width != nil || cs.widthPct != nil || (cs.aspectRatio != nil && cs.height != nil)
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
        if let own = points(s.width) ?? s.widthPct.map({ bw * CGFloat($0) / 100 }) {
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
final class ScreenView: UIScrollView, ScreenRoot, UIScrollViewDelegate {
    let root: Node
    /// The route's onEndReached: run when the content's end comes within half a screen.
    var onEndReached: (() -> Void)?
    private var endAt: CGFloat = -1

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        backgroundColor = screenBackground
        alwaysBounceVertical = true
        keyboardDismissMode = .interactive
        if let v = root.view { addSubview(v) }
        delegate = self
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        Runtime.shared.noteViewport(window.map { $0.frame.width } ?? bounds.width)
        let visible = bounds.height - adjustedContentInset.top - adjustedContentInset.bottom
        let size = CGSize(width: bounds.width, height: max(root.measure(maxWidth: bounds.width, exact: true).height, visible))
        root.place(CGRect(origin: .zero, size: size))
        if contentSize != size { contentSize = size }
        checkEnd()
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) { checkEnd() }

    /// Once per content height: a page that arrives makes the content taller, and the next end counts again.
    private func checkEnd() {
        guard let onEndReached, bounds.height > 0, contentSize.height != endAt else { return }
        guard contentOffset.y + bounds.height >= contentSize.height - bounds.height / 2 else { return }
        endAt = contentSize.height
        DispatchQueue.main.async { onEndReached() }
    }
}

/// The screen of a root that is itself a scrolling box: the box fills the safe area and scrolls by itself.
final class FixedScreenView: UIView, ScreenRoot {
    let root: Node

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        backgroundColor = screenBackground
        if let v = root.view { addSubview(v) }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        root.place(bounds.inset(by: safeInsets))
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
        root.place(bounds.inset(by: safeInsets))
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

    var onEndReached: (() -> Void)?

    override func loadView() {
        if root.scrollsItself {
            view = FixedScreenView(root)
        } else {
            let screen = ScreenView(root)
            screen.onEndReached = onEndReached
            view = screen
        }
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

    /// The window's width, which `@media` rules are matched against.
    private(set) var viewportWidth: CGFloat = UIScreen.main.bounds.width
    /// Whether some style has a media rule: only then does a new width restyle the app.
    var usesMedia = false

    func noteViewport(_ width: CGFloat) {
        guard width > 0, width != viewportWidth else { return }
        viewportWidth = width
        guard usesMedia else { return }
        DispatchQueue.main.async { [self] in
            for root in roots { root.applyStylesDeep() }
        }
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

// Remote images: decoded pictures in memory (NSCache: the system empties it under pressure), one download per URL
// at a time, the HTTP disk cache below. A view remembers the URL it wants: a late download never replaces a newer one.
@MainActor let imageCache: NSCache<NSString, UIImage> = { let c = NSCache<NSString, UIImage>(); c.totalCostLimit = 64 << 20; return c }()
@MainActor var imageWanted: [ObjectIdentifier: String] = [:]
@MainActor var imageLoads: [String: Task<UIImage?, Never>] = [:]

@MainActor func loadImage(_ url: String) async -> UIImage? {
    if let cached = imageCache.object(forKey: url as NSString) { return cached }
    if let running = imageLoads[url] { return await running.value }
    let task = Task<UIImage?, Never> {
        guard let u = URL(string: url), let (data, _) = try? await URLSession.shared.data(from: u) else { return nil }
        return await Task.detached { UIImage(data: data) }.value
    }
    imageLoads[url] = task
    let picture = await task.value
    imageLoads[url] = nil
    if let picture { imageCache.setObject(picture, forKey: url as NSString, cost: data(of: picture)) }
    return picture
}

private let symbolNames = [
    "home": "house", "search": "magnifyingglass", "grid": "square.grid.2x2", "heart": "heart", "heartFill": "heart.fill",
    "person": "person", "comment": "bubble.right", "send": "paperplane", "bookmark": "bookmark", "bookmarkFill": "bookmark.fill",
    "plus": "plus", "plusSquare": "plus.square", "menu": "line.3.horizontal", "mail": "envelope", "sliders": "slider.horizontal.3",
    "close": "xmark", "lock": "lock", "bell": "bell", "pencil": "pencil", "star": "star", "info": "info.circle",
    "sparkle": "sparkle", "contrast": "circle.lefthalf.filled", "box": "shippingbox", "move": "arrow.up.and.down.and.arrow.left.and.right",
    "swap": "arrow.left.arrow.right", "expand": "arrow.up.left.and.arrow.down.right", "target": "smallcircle.filled.circle",
    "carousel": "rectangle.stack", "arrowDown": "arrow.down", "checkbox": "checkmark.square", "sheet": "rectangle.bottomhalf.filled",
    "window": "macwindow", "header": "rectangle.topthird.inset.filled", "more": "ellipsis",
]

@MainActor func symbolImage(_ svg: String) -> UIImage? {
    func attr(_ name: String) -> String? {
        guard let start = svg.range(of: "\(name)='") else { return nil }
        return svg[start.upperBound...].split(separator: "'", maxSplits: 1).first.map(String.init)
    }
    guard let name = attr("data-icon").flatMap({ symbolNames[$0] }) else { return nil }
    #if canImport(UIKit)
    let color = parseColor(attr("stroke")) ?? .label
    return UIImage(systemName: name)?.withTintColor(color, renderingMode: .alwaysOriginal)
    #else
    return NSImage(systemSymbolName: name, accessibilityDescription: nil)
    #endif
}

@MainActor private func data(of picture: UIImage) -> Int { Int(picture.size.width * picture.size.height * 4) }

/** Loads a picture into the cache before a view asks for it. */
@MainActor public func prefetchImage(_ url: String) { Task { _ = await loadImage(url) } }

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
                guard let image = node.view as? UIImageView else { return }
                // nuclo-native-ns: an icon (an inline SVG) is the SF Symbol its `data-icon` names, in its stroke colour.
                if url.hasPrefix("data:image/svg+xml") { image.image = symbolImage(url); return }
                // A relative path is one of the app's own files (an example's assets/, copied into the bundle).
                if !url.contains("://") {
                    image.image = Bundle.main.path(forResource: url, ofType: nil).flatMap { UIImage(contentsOfFile: $0) }
                    return
                }
                imageWanted[ObjectIdentifier(image)] = url
                if let cached = imageCache.object(forKey: url as NSString) { image.image = cached; return }
                image.image = nil
                Task { @MainActor in
                    guard let picture = await loadImage(url), imageWanted[ObjectIdentifier(image)] == url else { return }
                    image.image = picture
                    image.alpha = 0
                    UIView.animate(withDuration: 0.16) { image.alpha = 1 }
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
        Attr { node in
            node.bind(value) {
                #if canImport(UIKit)
                node.view?.accessibilityLabel = $0
                #else
                node.view?.setAccessibilityLabel($0)
                #endif
            }
        }
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
            #if canImport(UIKit)
            field.keyboardType = type == "email" ? .emailAddress : type == "number" ? .decimalPad : .default
            field.autocapitalizationType = type == "email" ? .none : .sentences
            #endif
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
    public static func panAxis(_ axis: String) -> NodeMod { Attr { $0.touched()?.axis = axis } }
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

// nuclo-native-ns: the platform's own components. iOS: UIAlertController (alerts, action sheets), a UIMenu,
// page sheets with detents. macOS: NSAlert, NSMenu, a window sheet. Toasts have no native form on either.

public struct NativeAction {
    public let label: String
    public let kind: String
    public let run: () -> Void
    public init(_ label: String, _ kind: String, _ run: @escaping () -> Void) {
        self.label = label
        self.kind = kind
        self.run = run
    }
}

@MainActor public enum NativeUi {
    /// The bar buttons of the screen being built (`barButton`), taken by the router.
    public static var barActions: [NativeAction] = []

    private static func later(_ a: NativeAction) {
        DispatchQueue.main.async {
            a.run()
            Runtime.shared.update([])
        }
    }

    private static var captured: [NativeAction]?

    /// The items a submenu's action would open, collected instead of shown (its menuAt opens nothing then).
    private static func children(_ a: NativeAction) -> [NativeAction] {
        guard a.kind == "submenu" else { return [] }
        captured = []
        a.run()
        defer { captured = nil }
        return captured ?? []
    }

    /// A list of choices with one picked: picking one is a single selection.
    private static func isChoice(_ actions: [NativeAction]) -> Bool {
        actions.allSatisfy { $0.kind == "checked" || $0.kind == "unchecked" } && actions.filter { $0.kind == "checked" }.count == 1
    }

    #if canImport(UIKit)
    /// The controller on top: what presents the next alert or sheet.
    private static func top() -> UIViewController {
        var c: UIViewController = Runtime.shared.root
        while let next = c.presentedViewController, !next.isBeingDismissed { c = next }
        return c
    }

    private static func style(_ kind: String) -> UIAlertAction.Style {
        kind == "destructive" ? .destructive : kind == "cancel" ? .cancel : .default
    }

    public static func alert(_ title: String, _ message: String, _ actions: [NativeAction]) -> Bool {
        let c = UIAlertController(title: title, message: message.isEmpty ? nil : message, preferredStyle: .alert)
        for a in actions { c.addAction(UIAlertAction(title: a.label, style: style(a.kind)) { _ in later(a) }) }
        top().present(c, animated: true)
        return true
    }

    public static func actions(_ title: String, _ actions: [NativeAction]) -> Bool {
        let c = UIAlertController(title: title.isEmpty ? nil : title, message: nil, preferredStyle: .actionSheet)
        for a in actions { c.addAction(UIAlertAction(title: a.label, style: style(a.kind)) { _ in later(a) }) }
        if !actions.contains(where: { $0.kind == "cancel" }) { c.addAction(UIAlertAction(title: "Cancel", style: .cancel)) }
        // iPad: an action sheet is a popover from the middle of the window.
        let host = top()
        c.popoverPresentationController?.sourceView = host.view
        c.popoverPresentationController?.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.maxY - 80, width: 1, height: 1)
        host.present(c, animated: true)
        return true
    }

    private static var menuButton: UIButton?

    private static func uiMenu(_ title: String, _ actions: [NativeAction]) -> UIMenu {
        UIMenu(title: title, options: isChoice(actions) ? .singleSelection : [], children: actions.filter { $0.kind != "cancel" }.map { a -> UIMenuElement in
            let kids = children(a)
            if !kids.isEmpty { return uiMenu(a.label, kids) }
            let item = UIAction(title: a.label, attributes: a.kind == "destructive" ? .destructive : []) { _ in later(a) }
            if a.kind == "checked" { item.state = .on }
            return item
        })
    }

    /// A UIMenu at a point of the window (iOS 17.4+, which can open a button's menu from code); an action sheet before.
    public static func menu(_ x: Double, _ y: Double, _ title: String, _ actions: [NativeAction]) -> Bool {
        if captured != nil { captured = actions; return true }
        guard #available(iOS 17.4, *) else { return Self.actions(title, actions) }
        let host = Runtime.shared.root.view!
        menuButton?.removeFromSuperview()
        let button = UIButton(frame: CGRect(x: min(x, Double(host.bounds.width) - 2), y: y, width: 1, height: 1))
        button.menu = uiMenu(title, actions)
        button.showsMenuAsPrimaryAction = true
        host.addSubview(button)
        menuButton = button
        button.performPrimaryAction()
        return true
    }

    private static var sheets: [(UIViewController, SheetGone)] = []

    /// A page sheet of the app's view, with the platform's detents and grabber.
    public static func sheet(_ title: String, _ detent: String, _ node: Node) -> Bool {
        Runtime.shared.addRoot(node)
        let screen = ScreenController(node, title: title)
        let nav = UINavigationController(rootViewController: screen)
        nav.navigationBar.prefersLargeTitles = false
        let done = UIAction { _ in _ = closeSheet() }
        screen.navigationItem.rightBarButtonItem = UIBarButtonItem(systemItem: .close, primaryAction: done)
        if let sheet = nav.sheetPresentationController {
            sheet.detents = detent == "large" ? [.large()] : [.medium(), .large()]
            sheet.prefersGrabberVisible = true
            sheet.prefersScrollingExpandsWhenScrolledToEdge = true
        }
        let gone = SheetGone { sheets.removeAll { $0.0 === nav }; Runtime.shared.removeRoot(node) }
        nav.presentationController?.delegate = gone
        sheets.append((nav, gone))
        top().present(nav, animated: true)
        return true
    }

    /// The share sheet (a popover from the middle of the window on iPad).
    public static func share(_ text: String) -> Bool {
        let c = UIActivityViewController(activityItems: [URL(string: text) ?? text], applicationActivities: nil)
        let host = top()
        c.popoverPresentationController?.sourceView = host.view
        c.popoverPresentationController?.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.midY, width: 1, height: 1)
        host.present(c, animated: true)
        return true
    }

    public static func copy(_ text: String) { UIPasteboard.general.string = text }

    public static func closeSheet() -> Bool {
        guard let (nav, gone) = sheets.popLast() else { return false }
        nav.dismiss(animated: true) { gone.done() }
        return true
    }
    #else
    public static func alert(_ title: String, _ message: String, _ actions: [NativeAction]) -> Bool {
        let a = NSAlert()
        a.messageText = title
        a.informativeText = message
        // NSAlert's buttons run right to left: the main action first, Cancel last.
        let ordered = actions.filter { $0.kind != "cancel" }.reversed() + actions.filter { $0.kind == "cancel" }
        for action in ordered {
            let b = a.addButton(withTitle: action.label)
            b.hasDestructiveAction = action.kind == "destructive"
        }
        let answer = a.runModal().rawValue - NSApplication.ModalResponse.alertFirstButtonReturn.rawValue
        if answer >= 0 && answer < ordered.count { later(ordered[answer]) }
        return true
    }

    public static func actions(_ title: String, _ actions: [NativeAction]) -> Bool {
        let point = NSEvent.mouseLocation
        let window = NSApp.keyWindow
        let local = window.map { $0.convertPoint(fromScreen: point) } ?? .zero
        return menu(Double(local.x), Double((window?.contentView?.bounds.height ?? 0) - local.y), title, actions)
    }

    private final class Target: NSObject {
        let action: NativeAction
        init(_ action: NativeAction) { self.action = action }
        @objc func fire() { NativeUi.later(action) }
    }

    private static func nsMenu(_ title: String, _ actions: [NativeAction], _ targets: inout [Target]) -> NSMenu {
        let menu = NSMenu(title: title)
        if !title.isEmpty { menu.addItem(NSMenuItem.sectionHeader(title: title)) }
        for a in actions where a.kind != "cancel" {
            let item = NSMenuItem(title: a.label, action: nil, keyEquivalent: "")
            let kids = children(a)
            if !kids.isEmpty {
                item.submenu = nsMenu("", kids, &targets)
            } else {
                let target = Target(a)
                targets.append(target)
                item.action = #selector(Target.fire)
                item.target = target
                if a.kind == "checked" { item.state = .on }
            }
            menu.addItem(item)
        }
        return menu
    }

    /// An NSMenu at a point of the window (in points from its top left).
    public static func menu(_ x: Double, _ y: Double, _ title: String, _ actions: [NativeAction]) -> Bool {
        if captured != nil { captured = actions; return true }
        guard let view = NSApp.keyWindow?.contentView else { return false }
        var targets: [Target] = []
        let menu = nsMenu(title, actions, &targets)
        menu.popUp(positioning: nil, at: NSPoint(x: min(x, Double(view.bounds.width) - 4), y: Double(view.bounds.height) - y), in: view)
        _ = targets
        return true
    }

    private static var sheets: [(NSWindow, Node)] = []

    /// A window sheet of the app's view.
    public static func sheet(_ title: String, _ detent: String, _ node: Node) -> Bool {
        guard let window = NSApp.keyWindow else { return false }
        Runtime.shared.addRoot(node)
        let height = detent == "large" ? window.frame.height - 60 : window.frame.height * 0.55
        let panel = NSWindow(contentRect: NSRect(x: 0, y: 0, width: window.frame.width - 40, height: height), styleMask: [.titled], backing: .buffered, defer: false)
        panel.title = title
        let content = node.scrollsItself ? FixedScreenView(node) as UIView : ScreenView(node)
        panel.contentView = content
        sheets.append((panel, node))
        window.beginSheet(panel)
        return true
    }

    /// AppKit's sharing service picker, at the mouse.
    public static func share(_ text: String) -> Bool {
        guard let view = NSApp.keyWindow?.contentView else { return false }
        let picker = NSSharingServicePicker(items: [URL(string: text) ?? text])
        let point = view.convert(NSApp.keyWindow?.mouseLocationOutsideOfEventStream ?? .zero, from: nil)
        picker.show(relativeTo: NSRect(origin: point, size: CGSize(width: 1, height: 1)), of: view, preferredEdge: .minY)
        return true
    }

    public static func copy(_ text: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
    }

    public static func closeSheet() -> Bool {
        guard let (panel, node) = sheets.popLast() else { return false }
        panel.sheetParent?.endSheet(panel)
        Runtime.shared.removeRoot(node)
        return true
    }
    #endif
}

#if canImport(UIKit)
/// nuclo-native-ns: UIKit's own controls as nodes: a UISegmentedControl, a toggle button for a chip (UIKit has no
/// chip), a UISlider. macOS draws its own (the controls of AppKit are not views of the UIKit shim).
@MainActor public enum NativeControls {
    public static func segmented(_ options: [String], _ at: @escaping () -> Int32, _ pick: @escaping (Int32) -> Void) -> Node {
        let control = UISegmentedControl(items: options)
        control.addAction(UIAction { [unowned control] _ in
            let i = Int32(control.selectedSegmentIndex)
            if i != at() { pick(i) }
        }, for: .valueChanged)
        let node = Node(.native, tag: "native", native: control)
        node.bind(at) { control.selectedSegmentIndex = Int($0) }
        return node
    }

    public static func chip(_ label: String, _ on: @escaping () -> Bool, _ pick: @escaping () -> Void) -> Node {
        let button = UIButton(type: .system)
        button.addAction(UIAction { _ in pick() }, for: .primaryActionTriggered)
        let node = Node(.native, tag: "native", native: button)
        node.bind(on) { on in
            var c: UIButton.Configuration = on ? .tinted() : .gray()
            c.title = label
            c.image = on ? UIImage(systemName: "checkmark") : nil
            c.imagePadding = 4
            c.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(scale: .small)
            c.cornerStyle = .capsule
            button.configuration = c
        }
        return node
    }

    /// A UIButton: "filled", "tonal" (tinted), "danger", "small" (filled), "smallTonal" (gray).
    public static func button(_ label: @escaping () -> String, _ kind: @escaping () -> String, _ run: @escaping () -> Void) -> Node {
        let button = UIButton(type: .system)
        button.addAction(UIAction { _ in run() }, for: .primaryActionTriggered)
        let node = Node(.native, tag: "native", native: button)
        node.bind({ "\(kind())\u{1}\(label())" }) { _ in
            let k = kind()
            var c: UIButton.Configuration
            switch k {
            case "filled", "small": c = .filled()
            case "danger": c = .tinted(); c.baseForegroundColor = .systemRed; c.baseBackgroundColor = .systemRed
            case "smallTonal": c = .gray()
            default: c = .tinted()
            }
            c.title = label()
            c.cornerStyle = k.hasPrefix("small") ? .capsule : .large
            c.buttonSize = k.hasPrefix("small") ? .small : .large
            button.configuration = c
        }
        return node
    }

    /// The platform's pull to refresh: `content` in a scroller with a UIRefreshControl.
    public static func refresh(_ content: Node, _ refreshing: @escaping () -> Bool, _ refresh: @escaping () -> Void) -> Node {
        Runtime.shared.addRoot(content)
        let scroller = ScreenView(content)
        let control = UIRefreshControl()
        control.addAction(UIAction { _ in refresh() }, for: .valueChanged)
        scroller.refreshControl = control
        let node = Node(.native, tag: "native", native: scroller)
        node.add([css(Style(flex: 1))])
        node.bind(refreshing) { on in
            if !on && control.isRefreshing { control.endRefreshing() }
        }
        node.destroyCallbacks.append { _ in Runtime.shared.removeRoot(content) }
        return node
    }

    /// A drawing surface: each stroke a CAShapeLayer whose path runs through the touch's midpoints.
    public static func paint(_ ink: @escaping () -> String, _ width: Double, _ clears: @escaping () -> Int32) -> Node {
        let view = PaintView()
        view.lineWidth = CGFloat(width)
        let node = Node(.native, tag: "native", native: view)
        node.add([css(Style(flex: 1))])
        node.bind(ink) { view.ink = parseColor($0) ?? .label }
        node.bind(clears) { _ in view.clear() }
        return node
    }

    public static func spinner() -> Node {
        let view = UIActivityIndicatorView(style: .medium)
        view.startAnimating()
        return Node(.native, tag: "native", native: view)
    }

    /// A UISearchTextField: the search field of iOS, with its magnifying glass and clear button.
    public static func search(_ placeholder: String, _ value: @escaping () -> String, _ input: @escaping (String) -> Void, _ submit: @escaping (String) -> Void) -> Node {
        let field = UISearchTextField()
        field.placeholder = placeholder
        field.returnKeyType = .search
        field.addAction(UIAction { [unowned field] _ in input(field.text ?? "") }, for: .editingChanged)
        field.addAction(UIAction { [unowned field] _ in submit(field.text ?? ""); field.resignFirstResponder() }, for: .editingDidEndOnExit)
        let node = Node(.native, tag: "native", native: field)
        node.bind(value) { v in if field.text != v { field.text = v } }
        return node
    }

    public static func stepper(_ value: @escaping () -> Int32, _ min: Int32, _ max: Int32, _ change: @escaping (Int32) -> Void) -> Node {
        let stepper = UIStepper()
        stepper.minimumValue = Double(min)
        stepper.maximumValue = Double(max)
        stepper.addAction(UIAction { [unowned stepper] _ in change(Int32(stepper.value)) }, for: .valueChanged)
        let node = Node(.native, tag: "native", native: stepper)
        node.bind(value) { stepper.value = Double($0) }
        return node
    }

    public static func slider(_ value: @escaping () -> Double, _ color: String, _ change: @escaping (Double) -> Void) -> Node {
        let slider = UISlider()
        slider.minimumValue = 0
        slider.maximumValue = 1
        if let tint = parseColor(color.isEmpty ? nil : color) { slider.minimumTrackTintColor = tint }
        slider.addAction(UIAction { [unowned slider] _ in change(Double(slider.value)) }, for: .valueChanged)
        let node = Node(.native, tag: "native", native: slider)
        node.bind(value) { v in if !slider.isTracking { slider.value = Float(v) } }
        return node
    }
}

final class PaintView: UIView {
    var ink: UIColor = .label
    var lineWidth: CGFloat = 5
    private var path: UIBezierPath?
    private var stroke: CAShapeLayer?
    private var last = CGPoint.zero

    func clear() {
        layer.sublayers?.forEach { $0.removeFromSuperlayer() }
        path = nil
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let p = touches.first?.location(in: self) else { return }
        let shape = CAShapeLayer()
        shape.strokeColor = ink.cgColor
        shape.fillColor = nil
        shape.lineWidth = lineWidth
        shape.lineCap = .round
        shape.lineJoin = .round
        layer.addSublayer(shape)
        let bezier = UIBezierPath()
        bezier.move(to: p)
        bezier.addLine(to: CGPoint(x: p.x + 0.1, y: p.y))
        path = bezier
        stroke = shape
        shape.path = bezier.cgPath
        last = p
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, let bezier = path else { return }
        // The touches iOS coalesced between frames too, so a fast stroke keeps its shape.
        for t in event?.coalescedTouches(for: touch) ?? [touch] {
            let p = t.location(in: self)
            bezier.addQuadCurve(to: CGPoint(x: (last.x + p.x) / 2, y: (last.y + p.y) / 2), controlPoint: last)
            last = p
        }
        stroke?.path = bezier.cgPath
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        path?.addLine(to: last)
        stroke?.path = path?.cgPath
        path = nil
    }
}

/// Knows when a sheet goes (swiped down, or closed): its view tree is destroyed then.
final class SheetGone: NSObject, UIAdaptivePresentationControllerDelegate {
    private var gone: (() -> Void)?
    init(_ gone: @escaping () -> Void) { self.gone = gone }
    func done() {
        gone?()
        gone = nil
    }
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { done() }
}
#endif

@MainActor public func render(_ view: @escaping @MainActor () -> Node) { Runtime.shared.render(view()) }

@MainActor public func render(_ router: NRouter) { Runtime.shared.render(router) }

// MARK: - list()

/// Rows keyed by identity (classes) as nuclo's list(): a row is rebuilt only when its item is new.
@MainActor public func list<T: AnyObject>(_ items: @escaping @MainActor () -> JsArray<T>, _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment({ items().a }, render, key: { AnyHashable(ObjectIdentifier($0)) })
}

/// Rows keyed by value (strings, numbers).
@MainActor public func list<T: Hashable>(_ items: @escaping @MainActor () -> JsArray<T>, _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment({ items().a }, render, key: { AnyHashable($0) })
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
    let onEndReached: (@MainActor (Params) -> Void)?

    public init(
        _ pattern: String, _ view: @escaping @MainActor (Params) -> Node, title: (@MainActor (Params) -> String)? = nil,
        presentation: String = "push", header: Bool = true, onEndReached: (@MainActor (Params) -> Void)? = nil
    ) {
        parts = pattern.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        self.view = view
        self.title = title
        self.presentation = presentation
        self.header = header
        self.onEndReached = onEndReached
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
        // `NUCLO_PATH=/a/b`: start there, as a web deep link does (for checks against the web build).
        let initial = ProcessInfo.processInfo.environment["NUCLO_PATH"] ?? self.initial
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

    /// nuclo-native-ns: a modal screen in its own navigation bar, as iOS presents one: Cancel on the left, the
    /// screen's action (`barButton`) on the right, in bold.
    private func present(_ e: Entry, animated: Bool) {
        var top = container
        while let next = top.presentedViewController { top = next }
        #if canImport(UIKit)
        let nav = UINavigationController(rootViewController: e.controller)
        e.controller.navigationItem.leftBarButtonItem = UIBarButtonItem(systemItem: .cancel, primaryAction: UIAction { [weak self] _ in self?.back() })
        nav.modalPresentationStyle = .pageSheet
        nav.presentationController?.delegate = self
        top.present(nav, animated: animated)
        #else
        e.controller.modalPresentationStyle = .pageSheet
        e.controller.presentationController?.delegate = self
        top.present(e.controller, animated: animated)
        #endif
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
        var dismissed = presentationController.presentedViewController
        #if canImport(UIKit)
        if let nav = dismissed as? UINavigationController, let root = nav.viewControllers.first { dismissed = root }
        #endif
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
            NativeUi.barActions = []
            let node = route.view(params)
            let actions = NativeUi.barActions
            NativeUi.barActions = []
            Runtime.shared.addRoot(node)
            #if canImport(UIKit)
            let controller = ScreenController(node, title: route.title?(params) ?? "", header: route.header || route.presentation == "modal")
            // The screen's bar buttons; the last is its main action, in bold.
            controller.navigationItem.rightBarButtonItems = actions.reversed().enumerated().map { i, a in
                let item = UIBarButtonItem(title: a.label, primaryAction: UIAction { _ in
                    a.run()
                    Runtime.shared.update([])
                })
                if i == 0 { item.style = .done }
                return item
            }
            #else
            _ = actions
            let controller = ScreenController(node, title: route.title?(params) ?? "", header: route.header)
            #endif
            if let end = route.onEndReached { controller.onEndReached = { end(params) } }
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
        case "person": return "person.crop.circle"
        case "grid": return "square.grid.2x2"
        case "heart": return "heart"
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
        try decode(try jsJsonParse(String(decoding: data, as: UTF8.self)))
    }
}

@MainActor public func fetch(_ url: String, method: String = "GET", body: String? = nil, headers: JsMap<String> = [:]) async throws -> NResponse {
    guard let u = URL(string: url) else { throw NError("Invalid URL: \(url)") }
    var request = URLRequest(url: u)
    request.httpMethod = method
    request.httpBody = body?.data(using: .utf8)
    for (key, value) in headers.jsEntries { request.setValue(value, forHTTPHeaderField: key) }
    let (data, response) = try await URLSession.shared.data(for: request)
    return NResponse(status: (response as? HTTPURLResponse)?.statusCode ?? 0, data: data)
}

public func delay(_ ms: Double) async throws {
    try await Task.sleep(nanoseconds: UInt64(max(0, ms) * 1_000_000))
}

/// A timer of `setTimeout` / `setInterval`. Timers run in the order they are due (ties: the order they were set),
/// each as its own task: the microtasks it queues run before the next timer, as in JavaScript.
@MainActor public final class NTimer {
    fileprivate var callback: (@MainActor () -> Void)?
    fileprivate var due = 0.0
    fileprivate var seq = 0
    fileprivate var interval: Double?
    func cancel() { callback = nil }
}

@MainActor enum JsTimers {
    static var pending: [NTimer] = []
    static var seq = 0
    static let start = DispatchTime.now().uptimeNanoseconds

    static func now() -> Double {
        let origin = start
        return Double(DispatchTime.now().uptimeNanoseconds - origin) / 1_000_000
    }

    static func add(_ timer: NTimer, after ms: Double) {
        seq += 1
        timer.seq = seq
        timer.due = now() + max(0, ms)
        let i = pending.firstIndex { $0.due > timer.due } ?? pending.count
        pending.insert(timer, at: i)
        arm(timer.due)
    }

    static func arm(_ due: Double) {
        DispatchQueue.main.asyncAfter(deadline: .now() + max(0, due - now()) / 1000) { fire() }
    }

    static func fire() {
        jsDrainMicrotasks()
        while let first = pending.first, first.due <= now() {
            pending.removeFirst()
            guard let callback = first.callback else { continue }
            if first.interval == nil { first.callback = nil }
            callback()
            jsDrainMicrotasks()
            if let interval = first.interval, first.callback != nil { add(first, after: interval) }
        }
        if let first = pending.first { arm(first.due) }
    }
}

@MainActor @discardableResult public func setTimeout(_ callback: @escaping @MainActor () -> Void, _ ms: Double) -> NTimer {
    let timer = NTimer()
    timer.callback = callback
    JsTimers.add(timer, after: ms)
    return timer
}

@MainActor @discardableResult public func setInterval(_ callback: @escaping @MainActor () -> Void, _ ms: Double) -> NTimer {
    let timer = NTimer()
    timer.callback = callback
    timer.interval = max(1, ms)
    JsTimers.add(timer, after: max(1, ms))
    return timer
}

@MainActor public func clearTimeout(_ timer: NTimer) { timer.cancel() }
@MainActor public func clearInterval(_ timer: NTimer) { timer.cancel() }

// MARK: - Promises and the microtask queue

/// JavaScript's microtask queue: promise reactions and the resumptions of async functions run here, in FIFO order,
/// after the synchronous code that queued them and before the next timer or event. The runtime's entry points
/// (the app's start, timers, native completions) drain it; anything else queued gets a drain on the main queue.
@MainActor enum JsJobs {
    static var queue: [() -> Void] = []
    static var head = 0
    static var draining = false
    static var scheduled = false
    /// Promises rejected while nothing handled them: reported once the queue drains, if still unhandled.
    static var rejected: [JsRejection] = []
    /// A drain at the main run loop's next turn, before its timers and sources (the next event): in JavaScript the
    /// microtasks an event handler queued run as soon as it returns. (`DispatchQueue.main.async` alone may come after.)
    static var observing = false
    static func observe() {
        if observing { return }
        observing = true
        let activities = CFRunLoopActivity.beforeTimers.rawValue | CFRunLoopActivity.beforeSources.rawValue | CFRunLoopActivity.beforeWaiting.rawValue
        let observer = CFRunLoopObserverCreateWithHandler(nil, activities, true, 0) { _, _ in
            MainActor.assumeIsolated { if JsJobs.scheduled { jsDrainMicrotasks() } }
        }
        CFRunLoopAddObserver(CFRunLoopGetMain(), observer, .commonModes)
    }
}

@MainActor protocol JsRejection: AnyObject {
    var jsHandled: Bool { get }
    var jsReason: Error? { get }
}

@MainActor public func jsQueueMicrotask(_ job: @escaping () -> Void) {
    JsJobs.queue.append(job)
    jsScheduleDrain()
}

@MainActor func jsScheduleDrain() {
    if JsJobs.draining || JsJobs.scheduled { return }
    JsJobs.scheduled = true
    JsJobs.observe()
    DispatchQueue.main.async { jsDrainMicrotasks() }
}

/// Runs every queued microtask (and those they queue), then reports the rejections nothing handled.
@MainActor public func jsDrainMicrotasks() {
    if JsJobs.draining { return }
    JsJobs.draining = true
    while JsJobs.head < JsJobs.queue.count {
        let job = JsJobs.queue[JsJobs.head]
        JsJobs.head += 1
        job()
    }
    JsJobs.queue.removeAll(keepingCapacity: true)
    JsJobs.head = 0
    // The job is over: WeakRef targets it read are no longer kept (lib4).
    JsKept.objects.removeAll()
    JsJobs.draining = false
    JsJobs.scheduled = false
    // No app code is running: a safe point for the cycle collector.
    jsGcMaybe()
    if JsJobs.rejected.isEmpty { return }
    let rejected = JsJobs.rejected
    JsJobs.rejected = []
    for p in rejected where !p.jsHandled { consoleLog("Uncaught (in promise) \(jsErrorMessage(p.jsReason!))") }
}

/// `Promise<T>`: pending, then fulfilled with a value or rejected with an error, once. Its reactions run as
/// microtasks; they are dropped once it settles, so a promise holds no callback (and no cycle) after that.
@MainActor public final class JsPromise<T>: JsRejection {
    private var state = 0
    private var value: T?
    private var reason: Error?
    private var reactions: [(JsPromise<T>) -> Void] = []
    /// Resolved or rejected (or following another promise): what settles it later is ignored.
    private var resolved = false
    var jsHandled = false
    var jsReason: Error? { reason }
    /// The state machine of the async function this is the promise of (asyncLower.ts); dropped once it settles.
    fileprivate var step: ((JsPromise<T>) -> Void)?
    fileprivate var awaitError: Error?

    public init() {}

    public static func resolved(_ v: T) -> JsPromise<T> {
        let p = JsPromise<T>()
        p.resolve(v)
        return p
    }

    public static func rejected(_ e: Error) -> JsPromise<T> {
        let p = JsPromise<T>()
        p.reject(e)
        return p
    }

    public func resolve(_ v: T) {
        if resolved { return }
        resolved = true
        settle(1, v, nil)
    }

    public func reject(_ e: Error) {
        if resolved { return }
        resolved = true
        settle(2, nil, e)
    }

    /// Resolving with a promise: it follows `p`, starting a job later (JavaScript's NewPromiseResolveThenableJob).
    public func adopt(_ p: JsPromise<T>) {
        if resolved { return }
        resolved = true
        if p === self { return settle(2, nil, NError(name: "TypeError", "Chaining cycle detected for promise #<Promise>")) }
        jsQueueMicrotask { p.react({ self.settle(1, $0, nil) }, { self.settle(2, nil, $0) }) }
    }

    private func settle(_ s: Int, _ v: T?, _ e: Error?) {
        state = s
        value = v
        reason = e
        step = nil
        if s == 2 && !jsHandled {
            JsJobs.rejected.append(self)
            jsScheduleDrain()
        }
        let pending = reactions
        reactions = []
        for r in pending { jsQueueMicrotask { r(self) } }
    }

    /// JavaScript's PerformPromiseThen without a derived promise: one of the two runs in a job once it settled.
    func react(_ onFulfilled: @escaping (T) -> Void, _ onRejected: @escaping (Error) -> Void) {
        jsHandled = true
        let reaction: (JsPromise<T>) -> Void = { p in if p.state == 1 { onFulfilled(p.value!) } else { onRejected(p.reason!) } }
        if state == 0 { reactions.append(reaction) } else { jsQueueMicrotask { reaction(self) } }
    }

    public func then<U>(_ onFulfilled: @escaping (T) throws -> U) -> JsPromise<U> {
        let d = JsPromise<U>()
        react({ v in do { d.resolve(try onFulfilled(v)) } catch { d.reject(error) } }, { d.reject($0) })
        return d
    }

    public func thenP<U>(_ onFulfilled: @escaping (T) throws -> JsPromise<U>) -> JsPromise<U> {
        let d = JsPromise<U>()
        react({ v in do { d.adopt(try onFulfilled(v)) } catch { d.reject(error) } }, { d.reject($0) })
        return d
    }

    public func then2<U>(_ onFulfilled: @escaping (T) throws -> U, _ onRejected: @escaping (Error) throws -> U) -> JsPromise<U> {
        let d = JsPromise<U>()
        react({ v in do { d.resolve(try onFulfilled(v)) } catch { d.reject(error) } }, { e in do { d.resolve(try onRejected(e)) } catch { d.reject(error) } })
        return d
    }

    public func then2P<U>(_ onFulfilled: @escaping (T) throws -> JsPromise<U>, _ onRejected: @escaping (Error) throws -> JsPromise<U>) -> JsPromise<U> {
        let d = JsPromise<U>()
        react({ v in do { d.adopt(try onFulfilled(v)) } catch { d.reject(error) } }, { e in do { d.adopt(try onRejected(e)) } catch { d.reject(error) } })
        return d
    }

    public func jsCatch(_ onRejected: @escaping (Error) throws -> T) -> JsPromise<T> {
        then2({ $0 }, onRejected)
    }

    public func jsCatchP(_ onRejected: @escaping (Error) throws -> JsPromise<T>) -> JsPromise<T> {
        then2P({ JsPromise<T>.resolved($0) }, onRejected)
    }

    /// `finally(f)` as the specification writes it: `f`'s result (a promise, or a new resolved one) is waited
    /// for, then the value or the error goes on.
    public func jsFinally(_ f: @escaping () throws -> Void) -> JsPromise<T> {
        then2P({ v in try f(); return JsPromise<Void>.resolved(()).then { _ in v } }, { e in try f(); return JsPromise<Void>.resolved(()).then { _ -> T in throw e } })
    }

    public func jsFinallyP<X>(_ f: @escaping () throws -> JsPromise<X>) -> JsPromise<T> {
        then2P({ v in try f().then { _ in v } }, { e in try f().then { _ -> T in throw e } })
    }

    public static func all(_ ps: JsArray<JsPromise<T>>) -> JsPromise<JsArray<T>> {
        let ps = ps.a
        let d = JsPromise<JsArray<T>>()
        var values = [T?](repeating: nil, count: ps.count)
        var remaining = ps.count
        if ps.isEmpty { d.resolve([]) }
        for (i, p) in ps.enumerated() {
            p.react({ v in
                values[i] = v
                remaining -= 1
                if remaining == 0 { d.resolve(JsArray(values.map { $0! })) }
            }, { d.reject($0) })
        }
        return d
    }

    public static func allSettled(_ ps: JsArray<JsPromise<T>>) -> JsPromise<JsArray<JsSettled<T>>> {
        let ps = ps.a
        let d = JsPromise<JsArray<JsSettled<T>>>()
        var results = [JsSettled<T>?](repeating: nil, count: ps.count)
        var remaining = ps.count
        if ps.isEmpty { d.resolve([]) }
        for (i, p) in ps.enumerated() {
            let done = { (r: JsSettled<T>) in
                results[i] = r
                remaining -= 1
                if remaining == 0 { d.resolve(JsArray(results.map { $0! })) }
            }
            p.react({ done(JsSettled(status: "fulfilled", value: $0, reason: nil)) }, { done(JsSettled(status: "rejected", value: nil, reason: $0)) })
        }
        return d
    }

    public static func race(_ ps: JsArray<JsPromise<T>>) -> JsPromise<T> {
        let d = JsPromise<T>()
        for p in ps { p.react({ d.resolve($0) }, { d.reject($0) }) }
        return d
    }

    public static func any(_ ps: JsArray<JsPromise<T>>) -> JsPromise<T> {
        let d = JsPromise<T>()
        var remaining = ps.count
        if ps.isEmpty { d.reject(NError(name: "AggregateError", "")) }
        for p in ps {
            p.react({ d.resolve($0) }, { _ in
                remaining -= 1
                if remaining == 0 { d.reject(NError(name: "AggregateError", "")) }
            })
        }
        return d
    }

    /// `await q` in the async function this is the promise of: it resumes a job after `q` settles, with
    /// its value (`store`) or its error (thrown by `check()` where the function resumes).
    public func awaitOn<U>(_ q: JsPromise<U>, _ store: ((U) -> Void)? = nil) {
        q.react({ v in
            store?(v)
            self.step?(self)
        }, { e in
            self.awaitError = e
            self.step?(self)
        })
    }

    public func check() throws {
        guard let e = awaitError else { return }
        awaitError = nil
        throw e
    }
}

/// An element of `Promise.allSettled`'s result.
@MainActor public final class JsSettled<T> {
    public let status: String
    public let value: T?
    public let reason: Error?
    init(status: String, value: T?, reason: Error?) {
        self.status = status
        self.value = value
        self.reason = reason
    }
}

/// An async function's promise: `step` runs its body up to its first `await` at once, as JavaScript does.
@MainActor public func jsAsync<T>(_ step: @escaping (JsPromise<T>) -> Void) -> JsPromise<T> {
    let p = JsPromise<T>()
    p.step = step
    step(p)
    return p
}

extension JsPromise {
    /// `new Promise<T>(executor)`: the executor runs at once; what it throws rejects the promise.
    public static func create(_ executor: (@escaping (T) -> Void, @escaping (Error) -> Void) throws -> Void) -> JsPromise<T> {
        let p = JsPromise<T>()
        do { try executor({ p.resolve($0) }, { p.reject($0) }) } catch { p.reject(error) }
        return p
    }
}

extension JsPromise where T == Void {
    /// `new Promise<void>(executor)`: `resolve()` takes no value.
    public static func createVoid(_ executor: (@escaping () -> Void, @escaping (Error) -> Void) throws -> Void) -> JsPromise<Void> {
        let p = JsPromise<Void>()
        do { try executor({ p.resolve(()) }, { p.reject($0) }) } catch { p.reject(error) }
        return p
    }
}

/// The promise of a native async call (fetch, the app's platform code): settled from its task, then the
/// microtasks run, as after any task in JavaScript.
@MainActor public func jsNative<T>(_ call: @escaping @MainActor () async throws -> T) -> JsPromise<T> {
    let p = JsPromise<T>()
    Task { @MainActor in
        do { p.resolve(try await call()) } catch { p.reject(error) }
        jsDrainMicrotasks()
    }
    return p
}

/// `delay(ms)`: a promise a timer resolves.
@MainActor public func jsDelay(_ ms: Double) -> JsPromise<Void> {
    let p = JsPromise<Void>()
    setTimeout({ p.resolve(()) }, ms)
    return p
}

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

/// Decoders the compiler generates per interface call into these, over what `jsJsonParse` gives: `JsMap<Any>`
/// objects (JavaScript's key order), `[Any]` arrays, `String`, `Double`, `Bool` and `NSNull`.
public enum NJSON {
    public static func object(_ v: Any?) throws -> JsMap<Any> {
        guard let o = v as? JsMap<Any> else { throw NError("Expected a JSON object") }
        return o
    }

    public static func string(_ v: Any?) throws -> String {
        guard let s = v as? String else { throw NError("Expected a JSON string") }
        return s
    }

    public static func double(_ v: Any?) throws -> Double {
        guard let n = v as? Double else { throw NError("Expected a JSON number") }
        return n
    }

    public static func int(_ v: Any?) throws -> Int { Int(try double(v)) }

    public static func bool(_ v: Any?) throws -> Bool {
        guard let b = v as? Bool else { throw NError("Expected a JSON boolean") }
        return b
    }

    public static func array<T>(_ v: Any?, _ element: (Any?) throws -> T) throws -> JsArray<T> {
        guard let a = v as? [Any] else { throw NError("Expected a JSON array") }
        return JsArray(try a.map(element))
    }

    public static func map<T>(_ v: Any?, _ value: (Any?) throws -> T) throws -> JsMap<T> {
        let m = JsMap<T>()
        for (k, x) in try object(v).jsEntries { m[k] = try value(x) }
        return m
    }

    public static func optional<T>(_ v: Any?, _ value: (Any?) throws -> T) throws -> T? {
        v == nil || v is NSNull ? nil : try value(v)
    }
}

/// `JSON.parse(text)`: JavaScript's JSON grammar (a SyntaxError otherwise), numbers as JavaScript reads them, objects
/// in its key order (a repeated key keeps its first place and its last value).
public func jsJsonParse(_ text: String) throws -> Any {
    var p = NJSONParser(s: Array(text.utf16))
    p.ws()
    let v = try p.value()
    p.ws()
    guard p.i == p.s.count else { throw p.fail() }
    return v
}

struct NJSONParser {
    let s: [UInt16]
    var i = 0
    func fail() -> NError { NError(name: "SyntaxError", i < s.count ? "JSON Parse error: Unexpected character" : "JSON Parse error: Unexpected EOF") }
    func at(_ c: UInt16) -> Bool { i < s.count && s[i] == c }
    mutating func ws() { while i < s.count && (s[i] == 32 || s[i] == 9 || s[i] == 10 || s[i] == 13) { i += 1 } }
    mutating func lit(_ w: String) throws { for c in w.utf16 { guard at(c) else { throw fail() }; i += 1 } }
    mutating func digits() -> Bool { let d = i; while i < s.count && s[i] >= 48 && s[i] <= 57 { i += 1 }; return i > d }
    mutating func value() throws -> Any {
        guard i < s.count else { throw fail() }
        switch s[i] {
        case 123:
            i += 1
            let o = JsMap<Any>()
            ws()
            if at(125) { i += 1; return o }
            while true {
                ws()
                guard at(34) else { throw fail() }
                let k = try str()
                ws(); try lit(":"); ws()
                o[k] = try value()
                ws()
                if at(44) { i += 1; continue }
                guard at(125) else { throw fail() }
                i += 1
                return o
            }
        case 91:
            i += 1
            var a: [Any] = []
            ws()
            if at(93) { i += 1; return a }
            while true {
                ws()
                a.append(try value())
                ws()
                if at(44) { i += 1; continue }
                guard at(93) else { throw fail() }
                i += 1
                return a
            }
        case 34: return try str()
        case 116: try lit("true"); return true
        case 102: try lit("false"); return false
        case 110: try lit("null"); return NSNull()
        default:
            let start = i
            if at(45) { i += 1 }
            if at(48) { i += 1 } else if !digits() { throw fail() }
            if at(46) { i += 1; guard digits() else { throw fail() } }
            if at(101) || at(69) {
                i += 1
                if at(43) || at(45) { i += 1 }
                guard digits() else { throw fail() }
            }
            // Up to 15 digits, no fraction or exponent: exact in a Double (no text round trip).
            if i - start <= 15 && i > start && s[i - 1] >= 48 {
                var n = 0, k = start, neg = false
                if s[k] == 45 { neg = true; k += 1 }
                while k < i, s[k] >= 48 && s[k] <= 57 { n = n * 10 + Int(s[k] - 48); k += 1 }
                if k == i { return neg ? (n == 0 ? -0.0 : -Double(n)) : Double(n) }
            }
            return Double(String(decoding: s[start..<i], as: UTF16.self)) ?? .nan
        }
    }
    mutating func str() throws -> String {
        i += 1
        // Fast path: plain ASCII up to the closing quote, built as UTF-8 directly.
        var e = i
        while e < s.count, s[e] >= 32 && s[e] < 128 && s[e] != 34 && s[e] != 92 { e += 1 }
        if e < s.count && s[e] == 34 {
            let start = i
            i = e + 1
            return String(unsafeUninitializedCapacity: e - start) { b in
                for k in start..<e { b[k - start] = UInt8(truncatingIfNeeded: s[k]) }
                return e - start
            }
        }
        var u: [UInt16] = []
        while true {
            guard i < s.count else { throw fail() }
            let c = s[i]
            i += 1
            if c == 34 { return String(decoding: u, as: UTF16.self) }
            if c < 32 { i -= 1; throw fail() }
            if c != 92 { u.append(c); continue }
            guard i < s.count else { throw fail() }
            let e = s[i]
            i += 1
            switch e {
            case 34, 92, 47: u.append(e)
            case 98: u.append(8)
            case 102: u.append(12)
            case 110: u.append(10)
            case 114: u.append(13)
            case 116: u.append(9)
            case 117:
                var v: UInt16 = 0
                for _ in 0..<4 {
                    guard i < s.count, let h = jsDigit(UInt8(truncatingIfNeeded: s[i] < 128 ? s[i] : 0)), h < 16 else { throw fail() }
                    v = v << 4 | UInt16(h)
                    i += 1
                }
                u.append(v)
            default: throw fail()
            }
        }
    }
}

/// What `JSON.stringify` writes into: the generated encoders call it value by value, it lays out `gap` as JavaScript does.
public final class NJSONOut {
    var out = ""
    let gap: String
    var counts: [Int] = []
    var arrays: [Bool] = []
    init(_ gap: String) { self.gap = gap }
    func line() { if !gap.isEmpty { out += "\n"; for _ in counts { out += gap } } }
    func next() { if counts[counts.count - 1] > 0 { out += "," }; counts[counts.count - 1] += 1; line() }
    func pre() { if arrays.last == true { next() } }
    public func key(_ k: String) { next(); quote(k); out += gap.isEmpty ? ":" : ": " }
    public func null() { pre(); out += "null" }
    public func bool(_ b: Bool) { pre(); out += b ? "true" : "false" }
    public func num(_ d: Double) { pre(); out += d.isFinite ? jsNum(d) : "null" }
    public func num(_ n: Int) { num(Double(n)) }
    public func str(_ s: String) { pre(); quote(s) }
    public func date(_ d: JsDate) { if d.t.isNaN { null() } else { str(d.toISO()) } }
    func open(_ c: String, _ array: Bool) { pre(); out += c; counts.append(0); arrays.append(array) }
    func close(_ c: String) { arrays.removeLast(); if counts.removeLast() > 0 { line() }; out += c }
    public func obj(_ body: () throws -> Void) rethrows { open("{", false); try body(); close("}") }
    public func arr<T>(_ xs: JsArray<T>, _ f: (T) throws -> Void) rethrows { open("[", true); for x in Array(xs) { try f(x) }; close("]") }
    public func map<T>(_ m: JsMap<T>, _ f: (T) throws -> Void) rethrows { open("{", false); for (k, v) in m.jsEntries { key(k); try f(v) }; close("}") }
    /// An object's field: left out when it is undefined.
    public func field<T>(_ k: String, _ v: T?, _ f: (T) throws -> Void) rethrows { if let v { key(k); try f(v) } }
    public func opt<T>(_ v: T?, _ f: (T) throws -> Void) rethrows { if let v { try f(v) } else { null() } }
    func quote(_ s: String) {
        // Fast path: ASCII with nothing to escape goes in as is.
        if s.jsAscii({ b in !b.contains { $0 < 32 || $0 == 34 || $0 == 92 } }) == true {
            out += "\""
            out += s
            out += "\""
            return
        }
        var u: [UInt16] = [34]
        let units = Array(s.utf16)
        for (n, c) in units.enumerated() {
            switch c {
            case 34: u += [92, 34]
            case 92: u += [92, 92]
            case 8: u += [92, 98]
            case 12: u += [92, 102]
            case 10: u += [92, 110]
            case 13: u += [92, 114]
            case 9: u += [92, 116]
            default:
                let lone = (c >= 0xD800 && c < 0xDC00 && !(n + 1 < units.count && units[n + 1] >= 0xDC00 && units[n + 1] < 0xE000))
                    || (c >= 0xDC00 && c < 0xE000 && !(n > 0 && units[n - 1] >= 0xD800 && units[n - 1] < 0xDC00))
                if c < 32 || lone { u += Array(String(format: "\\u%04x", c).utf16) } else { u.append(c) }
            }
        }
        u.append(34)
        out += String(decoding: u, as: UTF16.self)
    }
}

/// `JSON.stringify(value, null, gap)`: `write` writes the value.
public func jsJsonStringify<T>(_ value: T, _ gap: String, _ write: (NJSONOut, T) -> Void) -> String {
    let o = NJSONOut(gap)
    write(o, value)
    return o.out
}
/// `JSON.parse(text) as T`: `decode` is T's generated decoder.
public func jsJsonDecode<T>(_ text: String, _ decode: (Any?) throws -> T) throws -> T { try decode(try jsJsonParse(text)) }
/// The indent of `JSON.stringify(v, null, n)`: up to 10 spaces; of `(v, null, s)`: the first 10 code units of s.
public func jsJsonGap(_ n: Double) -> String { n >= 1 ? String(repeating: " ", count: Int(Swift.min(10, n))) : "" }
public func jsJsonGap(_ s: String) -> String { String(decoding: Array(s.utf16.prefix(10)), as: UTF16.self) }

// MARK: - Date

/// A JavaScript Date: a shared, mutable time value (milliseconds since 1970 UTC, NaN when invalid); `===` is identity.
/// Local time is the platform's zone (TimeZone.current, which reads TZ), as JavaScript's is.
public final class JsDate: Equatable {
    public var t: Double
    public init(_ t: Double) { self.t = jsTimeClip(t) }
    public static func == (a: JsDate, b: JsDate) -> Bool { a === b }
    public static func now() -> JsDate { JsDate(jsNow()) }
    public static func parts(_ a: [Double]) -> JsDate { JsDate(jsUTCFromLocal(jsMakeParts(a))) }

    /// The fields of the time value `base` (the last ones are kept: getters in a row compute them once).
    private var fieldsAt = Double.nan, fields: [Double] = []
    private func fieldsOf(_ base: Double) -> [Double] {
        if base != fieldsAt { fields = jsDateFields(base); fieldsAt = base }
        return fields
    }
    /// A field of the date: 0 year, 1 month, 2 date, 3 hours, 4 minutes, 5 seconds, 6 ms, 7 weekday.
    public func get(_ field: Int, _ local: Bool) -> Double {
        if t.isNaN { return .nan }
        return fieldsOf(local ? t + jsLocalOffset(t) : t)[field]
    }
    /// The setters: `args` replace the fields from `from` on (setFullYear 0 … setMilliseconds 6).
    @discardableResult public func set(_ from: Int, _ local: Bool, _ args: [Double]) -> Double {
        var base = t
        if base.isNaN { if from != 0 { return .nan }; base = 0 } else if local { base += jsLocalOffset(base) }
        var f = fieldsOf(base)
        for (n, a) in args.enumerated() { f[from + n] = a }
        let v = jsMakeDate(jsMakeDay(f[0], f[1], f[2]), jsMakeTime(f[3], f[4], f[5], f[6]))
        t = jsTimeClip(local ? jsUTCFromLocal(v) : v)
        return t
    }
    @discardableResult public func setTime(_ v: Double) -> Double { t = jsTimeClip(v); return t }
    public func timezoneOffset() -> Double { t.isNaN ? .nan : -jsLocalOffset(t) / 60000 }

    public func toISOString() throws -> String {
        if t.isNaN { throw NError(name: "RangeError", "Invalid Date") }
        return toISO()
    }
    public func toJSON() -> String? { t.isNaN ? nil : toISO() }
    func toISO() -> String {
        let f = jsDateFields(t)
        let y = Int(f[0])
        let year = y >= 0 && y <= 9999 ? jsPad(y, 4) : (y < 0 ? "-" : "+") + jsPad(abs(y), 6)
        return "\(year)-\(jsPad(Int(f[1]) + 1, 2))-\(jsPad(Int(f[2]), 2))T\(jsPad(Int(f[3]), 2)):\(jsPad(Int(f[4]), 2)):\(jsPad(Int(f[5]), 2)).\(jsPad(Int(f[6]), 3))Z"
    }
    public func toUTCString() -> String {
        if t.isNaN { return "Invalid Date" }
        let f = jsDateFields(t)
        let y = Int(f[0])
        return "\(jsWeekdays[Int(f[7])]), \(jsPad(Int(f[2]), 2)) \(jsMonths[Int(f[1])]) \(y < 0 ? "-" : "")\(jsPad(abs(y), 4)) \(jsPad(Int(f[3]), 2)):\(jsPad(Int(f[4]), 2)):\(jsPad(Int(f[5]), 2)) GMT"
    }
    public func toDateString() -> String {
        if t.isNaN { return "Invalid Date" }
        let f = jsDateFields(t + jsLocalOffset(t))
        let y = Int(f[0])
        return "\(jsWeekdays[Int(f[7])]) \(jsMonths[Int(f[1])]) \(jsPad(Int(f[2]), 2)) \(y < 0 ? "-" : "")\(jsPad(abs(y), 4))"
    }
}

let jsWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
let jsMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
func jsPad(_ n: Int, _ width: Int) -> String { let s = String(n); return String(repeating: "0", count: Swift.max(0, width - s.count)) + s }

/// TimeClip: NaN past ±8.64e15 ms, else the whole number toward zero (+0, never -0).
public func jsTimeClip(_ t: Double) -> Double { !t.isFinite || Swift.abs(t) > 8.64e15 ? .nan : t.rounded(.towardZero) + 0 }
/// Date.UTC(y, m?, d?, h?, mi?, s?, ms?) / the local parts of `new Date(y, m, …)` (years 0 to 99 are 1900 to 1999).
public func jsMakeParts(_ a: [Double]) -> Double {
    var f: [Double] = [.nan, 0, 1, 0, 0, 0, 0]
    for (n, v) in a.enumerated() where n < 7 { f[n] = v }
    if f[0].isFinite { let y = f[0].rounded(.towardZero); if y >= 0 && y <= 99 { f[0] = 1900 + y } }
    return jsMakeDate(jsMakeDay(f[0], f[1], f[2]), jsMakeTime(f[3], f[4], f[5], f[6]))
}
public func jsDateUTC(_ a: [Double]) -> Double { jsTimeClip(jsMakeParts(a)) }
func jsMakeDay(_ y: Double, _ m: Double, _ d: Double) -> Double {
    if !y.isFinite || !m.isFinite || !d.isFinite { return .nan }
    let (yi, mi, di) = (y.rounded(.towardZero), m.rounded(.towardZero), d.rounded(.towardZero))
    let ym = yi + (mi / 12).rounded(.down)
    let mn = mi - (mi / 12).rounded(.down) * 12
    return jsDaysFromCivil(ym, mn + 1, 1) + di - 1
}
func jsMakeTime(_ h: Double, _ m: Double, _ s: Double, _ ms: Double) -> Double {
    if !h.isFinite || !m.isFinite || !s.isFinite || !ms.isFinite { return .nan }
    return h.rounded(.towardZero) * 3_600_000 + m.rounded(.towardZero) * 60000 + s.rounded(.towardZero) * 1000 + ms.rounded(.towardZero)
}
func jsMakeDate(_ day: Double, _ time: Double) -> Double { day.isFinite && time.isFinite ? day * 86_400_000 + time : .nan }
/// Days since 1970-01-01 of a proleptic Gregorian date (month 1 to 12).
func jsDaysFromCivil(_ y0: Double, _ m: Double, _ d: Double) -> Double {
    let y = m <= 2 ? y0 - 1 : y0
    let era = (y / 400).rounded(.down)
    let yoe = y - era * 400
    let doy = ((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5).rounded(.down) + d - 1
    let doe = yoe * 365 + (yoe / 4).rounded(.down) - (yoe / 100).rounded(.down) + doy
    return era * 146_097 + doe - 719_468
}
/// Year, month (0 to 11), date, hours, minutes, seconds, ms and weekday of a time value.
func jsDateFields(_ t: Double) -> [Double] {
    let day = (t / 86_400_000).rounded(.down)
    var ms = t - day * 86_400_000
    let z = day + 719_468
    let era = (z / 146_097).rounded(.down)
    let doe = z - era * 146_097
    let yoe = ((doe - (doe / 1460).rounded(.down) + (doe / 36524).rounded(.down) - (doe / 146_096).rounded(.down)) / 365).rounded(.down)
    let doy = doe - (365 * yoe + (yoe / 4).rounded(.down) - (yoe / 100).rounded(.down))
    let mp = ((5 * doy + 2) / 153).rounded(.down)
    let d = doy - ((153 * mp + 2) / 5).rounded(.down) + 1
    let m = mp < 10 ? mp + 2 : mp - 10
    let y = yoe + era * 400 + (m <= 1 ? 1 : 0)
    let h = (ms / 3_600_000).rounded(.down); ms -= h * 3_600_000
    let mi = (ms / 60000).rounded(.down); ms -= mi * 60000
    let s = (ms / 1000).rounded(.down); ms -= s * 1000
    let wd = day - ((day + 4) / 7).rounded(.down) * 7 + 4
    return [y, m, d, h, mi, s, ms, wd.truncatingRemainder(dividingBy: 7)]
}
/// The platform zone's offset from UTC at the instant `t`, in ms.
public func jsLocalOffset(_ t: Double) -> Double {
    Double(TimeZone.current.secondsFromGMT(for: Date(timeIntervalSince1970: t / 1000))) * 1000
}
/// UTC(t) of a local time: the earlier instant of a repeated hour, the offset before the change for a skipped one.
public func jsUTCFromLocal(_ tl: Double) -> Double {
    if !tl.isFinite { return .nan }
    let a = jsLocalOffset(tl - 86_400_000), b = jsLocalOffset(tl + 86_400_000)
    let (t1, t2) = (tl - a, tl - b)
    let ok1 = jsLocalOffset(t1) == a, ok2 = jsLocalOffset(t2) == b
    if ok1 && ok2 { return Swift.min(t1, t2) }
    return ok1 ? t1 : ok2 ? t2 : t1
}
/// Date.parse of the ISO format JavaScript reads (date-only forms are UTC, a date-time without an offset local time); NaN otherwise.
public func jsDateParse(_ text: String) -> Double {
    let s = Array(text.utf8)
    var i = 0
    func num(_ n: Int) -> Double? {
        guard i + n <= s.count, s[i..<i + n].allSatisfy({ $0 >= 48 && $0 <= 57 }) else { return nil }
        defer { i += n }
        return Double(String(decoding: s[i..<i + n], as: UTF8.self))
    }
    func at(_ c: UInt8) -> Bool { if i < s.count && s[i] == c { i += 1; return true }; return false }
    var y: Double
    if i < s.count && (s[i] == 43 || s[i] == 45) {
        let neg = s[i] == 45
        i += 1
        guard let v = num(6), !(neg && v == 0) else { return .nan }
        y = neg ? -v : v
    } else {
        guard let v = num(4) else { return .nan }
        y = v
    }
    var (mo, d, h, mi, sec, ms) = (1.0, 1.0, 0.0, 0.0, 0.0, 0.0)
    if at(45) {
        guard let v = num(2), v >= 1 && v <= 12 else { return .nan }
        mo = v
        if at(45) { guard let v = num(2), v >= 1 && v <= 31 else { return .nan }; d = v }
    }
    var offset: Double? = 0
    if i < s.count && (s[i] == 84 || s[i] == 116 || s[i] == 32) {
        i += 1
        guard let hh = num(2), at(58), let mm = num(2), mm <= 59 else { return .nan }
        (h, mi) = (hh, mm)
        if at(58) {
            guard let ss = num(2), ss <= 59 else { return .nan }
            sec = ss
            if at(46) {
                let start = i
                while i < s.count && s[i] >= 48 && s[i] <= 57 { i += 1 }
                guard i > start else { return .nan }
                let digits = String(decoding: s[start..<Swift.min(i, start + 3)], as: UTF8.self)
                ms = Double(digits.padding(toLength: 3, withPad: "0", startingAt: 0))!
            }
        }
        guard h < 24 || (h == 24 && mi == 0 && sec == 0 && ms == 0) else { return .nan }
        offset = nil
        if at(90) || at(122) { offset = 0 } else if i < s.count && (s[i] == 43 || s[i] == 45) {
            let sign: Double = s[i] == 45 ? -1 : 1
            i += 1
            guard let oh = num(2), oh <= 23 else { return .nan }
            _ = at(58)
            guard let om = num(2), om <= 59 else { return .nan }
            offset = sign * (oh * 60 + om) * 60000
        }
    }
    guard i == s.count else { return .nan }
    let local = jsMakeDate(jsMakeDay(y, mo - 1, d), jsMakeTime(h, mi, sec, ms))
    return jsTimeClip(offset.map { local - $0 } ?? jsUTCFromLocal(local))
}

// MARK: - JavaScript semantics

/// Numbers the way JavaScript prints them: 3, not 3.0; 1e+21 and 1e-7, never 1.0E21 or 9007199254740992.0.
public func jsNum(_ d: Double) -> String {
    if d.isNaN { return "NaN" }
    if d.isInfinite { return d > 0 ? "Infinity" : "-Infinity" }
    if d == 0 { return "0" }
    if d == d.rounded() && abs(d) < 1e15 { return String(Int(d)) }
    // Swift's description has the shortest digits that read back as `d`: lay them out as JavaScript does.
    // (Bytes, not Character ops: this is every number printed.)
    var digits: [UInt8] = [], point = 0, exponent = 0, dot = false
    var text = abs(d).description
    text.withUTF8 { b in
        for (i, c) in b.enumerated() {
            if c == 46 { dot = true } else if c == 101 || c == 69 {
                exponent = Int(String(decoding: UnsafeBufferPointer(rebasing: b[(i + 1)...]), as: UTF8.self)) ?? 0
                break
            } else {
                digits.append(c)
                if !dot { point += 1 }
            }
        }
    }
    return (d < 0 ? "-" : "") + jsLayout(digits, point + exponent)
}

/// Number::toString's layout of the digits `digits` with the decimal point after `point` of them.
func jsLayout(_ digits: String, _ point: Int) -> String { jsLayout(Array(digits.utf8), point) }
func jsLayout(_ ds: [UInt8], _ point: Int) -> String {
    var lo = 0, hi = ds.count, n = point
    while hi - lo > 1 && ds[lo] == 48 { lo += 1; n -= 1 }
    while hi - lo > 1 && ds[hi - 1] == 48 { hi -= 1 }
    let k = hi - lo
    var out: [UInt8] = []
    out.reserveCapacity(k + 28)
    if k <= n && n <= 21 {
        out += ds[lo..<hi]
        out += repeatElement(48, count: n - k)
    } else if 0 < n && n <= 21 {
        out += ds[lo..<(lo + n)]
        out.append(46)
        out += ds[(lo + n)..<hi]
    } else if -6 < n && n <= 0 {
        out += [48, 46]
        out += repeatElement(48, count: -n)
        out += ds[lo..<hi]
    } else {
        let e = n - 1
        out.append(ds[lo])
        if k > 1 { out.append(46); out += ds[(lo + 1)..<hi] }
        out += [101, e >= 0 ? 43 : 45]
        out += String(abs(e)).utf8
    }
    return String(decoding: out, as: UTF8.self)
}

/// `toFixed`: the exact binary value rounded half up (printf rounds an exact tie to even); -0 is "0"; NaN, ±Infinity
/// and anything from 1e21 print as `String(d)`.
public func jsFixed(_ d: Double, _ digits: Int) -> String {
    if !d.isFinite || Swift.abs(d) >= 1e21 { return jsNum(d) }
    if d < 0 { return "-" + jsFixed(-d, digits) }
    // A tie at this precision is an odd multiple of 2^-(digits + 1).
    let scaled = d * Foundation.pow(2, Double(digits + 1))
    let tie = scaled.rounded(.towardZero) == scaled && scaled.truncatingRemainder(dividingBy: 2) != 0
    if !tie { return jsPrintf("%.*f", digits, d + 0) { String(decoding: $0, as: UTF8.self) } }
    // A tie's text with one more digit is exact (it ends in 5): drop it and add one unit by hand (d.nextUp can be a
    // whole unit away: 707273840904235.875.toFixed(2)).
    return jsPrintf("%.*f", digits + 1, d) { b in
        var u = Array(b.dropLast())
        if u.last == 46 { u.removeLast() }
        var i = u.count - 1
        while i >= 0 && (u[i] == 57 || u[i] == 46) { if u[i] == 57 { u[i] = 48 }; i -= 1 }
        if i < 0 { u.insert(49, at: 0) } else { u[i] += 1 }
        return String(decoding: u, as: UTF8.self)
    }
}
/// `Object.is` of numbers: SameValue (NaN is NaN, -0 isn't +0).
public func jsObjectIs(_ a: Double, _ b: Double) -> Bool { a == b ? (a != 0 || a.sign == b.sign) : (a.isNaN && b.isNaN) }
/// `Number.isSafeInteger`.
public func jsIsSafeInteger(_ d: Double) -> Bool { d.rounded(.towardZero) == d && Swift.abs(d) <= 9007199254740991 }
/// `s.replace(pattern, f)` / `replaceAll`: f(match, offset in UTF-16 units, s) for each match, left to right.
public func jsReplaceFn(_ s: String, _ pattern: String, _ f: (String, Double, String) throws -> String) rethrows -> String { try jsReplaceBy(s, pattern, false, f) }
public func jsReplaceAllFn(_ s: String, _ pattern: String, _ f: (String, Double, String) throws -> String) rethrows -> String { try jsReplaceBy(s, pattern, true, f) }
private func jsReplaceBy(_ s: String, _ pattern: String, _ all: Bool, _ f: (String, Double, String) throws -> String) rethrows -> String {
    let h = Array(s.utf16), n = Array(pattern.utf16)
    var out: [UInt16] = [], last = 0, i = 0
    while i + n.count <= h.count {
        if h[i..<(i + n.count)].elementsEqual(n) {
            out += h[last..<i]
            out += Array(try f(pattern, Double(i), s).utf16)
            last = i + n.count
            if !all { break }
            i += Swift.max(n.count, 1)
        } else { i += 1 }
    }
    out += h[last...]
    return String(decoding: out, as: UTF16.self)
}
/// `new Array(n)`'s length: a RangeError unless n is a whole number below 2^32.
public func jsArrayLength(_ n: Double) throws -> Int {
    guard n >= 0 && n < 4294967296 && n.rounded(.towardZero) == n else { throw NError(name: "RangeError", "Array length must be a positive integer of safe magnitude.") }
    return Int(n)
}
/// ToIntegerOrInfinity: NaN is 0, fractions truncate toward 0.
@inline(__always) public func jsToInteger(_ d: Double) -> Double { d.isNaN ? 0 : d.rounded(.towardZero) + 0 }
/// `s.repeat(n)` of a count not known statically: a RangeError for a negative or infinite count.
public func jsStrRepeat(_ s: String, _ n: Double) throws -> String {
    let t = jsToInteger(n)
    guard t >= 0 && t.isFinite else { throw NError(name: "RangeError", "String.prototype.repeat argument must be greater than or equal to 0 and not be Infinity") }
    return t == 0 || s.isEmpty ? "" : String(repeating: s, count: Int(t))
}
/// `d.toFixed(f)` of digits not known statically: a RangeError out of 0...100.
public func jsToFixedChecked(_ d: Double, _ f: Double) throws -> String {
    let t = jsToInteger(f)
    guard t >= 0 && t <= 100 else { throw NError(name: "RangeError", "toFixed() argument must be between 0 and 100") }
    return jsFixed(d, Int(t))
}
/// `Math.round`: the nearest integer, a half up (`d + 0.5` would round 0.49999999999999994 up).
/// `Math.round` of any number (NaN and ±Infinity stay themselves).
public func jsRoundD(_ d: Double) -> Double { let f = d.rounded(.down); return d - f >= 0.5 ? f + 1 : f }
public func jsRound(_ d: Double) -> Int { let f = d.rounded(.down); return Int(d - f >= 0.5 ? f + 1 : f) }
/// `Date.now()`: whole milliseconds, as in JavaScript.
public func jsNow() -> Double { (Date().timeIntervalSince1970 * 1000).rounded(.down) }
/// `Number(s)`: JavaScript's StringToNumber (white space trimmed, "" is 0, 0x / 0o / 0b, Infinity, no "inf" or "1_0").
public func jsNumber(_ s: String) -> Double {
    let t = Array(s.jsTrim().utf8)
    if t.isEmpty { return 0 }
    if t.count > 2 && t[0] == 48, let radix = [120: 16, 88: 16, 111: 8, 79: 8, 98: 2, 66: 2][Int(t[1])] {
        var v = 0.0
        for c in t[2...] { guard let d = jsDigit(c), d < radix else { return .nan }; v = v * Double(radix) + Double(d) }
        return v
    }
    var i = t.first == 43 || t.first == 45 ? 1 : 0
    if Array(t[i...]) == Array("Infinity".utf8) { return t[0] == 45 ? -.infinity : .infinity }
    var digits = 0
    while i < t.count && jsDigit(t[i]).map({ $0 < 10 }) == true { i += 1; digits += 1 }
    if i < t.count && t[i] == 46 { i += 1; while i < t.count && jsDigit(t[i]).map({ $0 < 10 }) == true { i += 1; digits += 1 } }
    if digits == 0 { return .nan }
    if i < t.count && (t[i] == 101 || t[i] == 69) {
        i += 1
        if i < t.count && (t[i] == 43 || t[i] == 45) { i += 1 }
        let start = i
        while i < t.count && jsDigit(t[i]).map({ $0 < 10 }) == true { i += 1 }
        if i == start { return .nan }
    }
    return i == t.count ? strtod(String(decoding: t, as: UTF8.self), nil) : .nan
}
/// `parseInt(s, radix)`: the longest run of digits after white space, a sign and (radix 16 or none) 0x; NaN if none.
public func jsParseInt(_ s: String, _ radix: Double = 0) -> Double {
    var t = Array(s.jsTrimStart().utf8)[...]
    let negative = t.first == 45
    if t.first == 43 || t.first == 45 { t = t.dropFirst() }
    var r = Int(jsI32(radix))
    if r != 0 && (r < 2 || r > 36) { return .nan }
    if (r == 0 || r == 16) && t.count >= 2 && t[t.startIndex] == 48 && (t[t.startIndex + 1] | 0x20) == 120 { t = t.dropFirst(2); r = 16 }
    if r == 0 { r = 10 }
    let run = t.prefix { jsDigit($0).map { $0 < r } == true }
    if run.isEmpty { return .nan }
    let v = r == 10 ? strtod(String(decoding: run, as: UTF8.self), nil) : run.reduce(0.0) { $0 * Double(r) + Double(jsDigit($1)!) }
    return negative ? -v : v
}
private func jsDigit(_ c: UInt8) -> Int? {
    switch c {
    case 48...57: return Int(c) - 48
    case 97...122: return Int(c) - 87
    case 65...90: return Int(c) - 55
    default: return nil
    }
}
/// `Math.max` / `Math.min` of numbers: NaN if any is NaN, and +0 above -0.
public func jsMax(_ a: Int, _ b: Int) -> Int { Swift.max(a, b) }
public func jsMin(_ a: Int, _ b: Int) -> Int { Swift.min(a, b) }
public func jsMax(_ a: Double, _ b: Double) -> Double { a.isNaN || b.isNaN ? .nan : a > b || (a == b && b.sign == .minus) ? a : b }
public func jsMin(_ a: Double, _ b: Double) -> Double { a.isNaN || b.isNaN ? .nan : a < b || (a == b && a.sign == .minus) ? a : b }
public func jsOr(_ a: String, _ b: String) -> String { a.isEmpty ? b : a }
/** `f(v)`: a value computed once, then used (by `&&` / `||` on values: tested, then kept or not). */
@inline(__always) public func jsWith<T, R>(_ v: T, _ f: (T) throws -> R) rethrows -> R { try f(v) }
/** Statements inside an expression (an assignment used as a value), then its value. */
@inline(__always) public func jsRun<R>(_ f: () throws -> R) rethrows -> R { try f() }

/// `xs[i]!` out of range: JavaScript reads undefined and goes on, the native element type can't hold it. The trap
/// says which JavaScript operation it was (the same words on every target).
@inline(never) @usableFromInline func jsTrapIndex(_ i: Int, _ count: Int) -> Never {
    fatalError("nuclo: xs[i]! read index \(i) of an array of length \(count): JavaScript gives undefined there, which the element type can't hold. Test the index (i < xs.length) or use xs[i] ?? fallback.")
}

public func jsErrorMessage(_ error: Error) -> String {
    let message = (error as? NError)?.message ?? error.localizedDescription
    let name = (error as? NError)?.name ?? "Error"
    return message.isEmpty ? name : "\(name): \(message)"
}

/// `Record<string, T>`: a hash map (O(1) reads, writes and deletes) that lists its keys in JavaScript's order:
/// integer-like keys ascending, then the others in insertion order (a key deleted and set again goes last).
/// A map key compared by code units (Swift's String equates canonically equivalent text; its hash stays consistent).
public struct JsKey: Hashable {
    public let s: String
    public init(_ s: String) { self.s = s }
    // `==` first: Swift compares small strings' bits directly, so a mismatch while probing stays cheap.
    public static func == (a: JsKey, b: JsKey) -> Bool { a.s == b.s && jsStrEq(a.s, b.s) }
    public func hash(into h: inout Hasher) { h.combine(s) }
    /// What Dictionary calls: a multiply-mix hash of the UTF-8 bytes (equal code units, equal bytes), not SipHash
    /// over the NFC-normalized text.
    public func _rawHashValue(seed: Int) -> Int {
        var t = s
        return t.withUTF8 { Int(truncatingIfNeeded: jsHashBytes($0, UInt64(bitPattern: Int64(seed)))) }
    }
}

/// A Map / Set number key's hash input (SameValueZero bits): Dictionary hashes it with one mix, not SipHash.
public struct JsNumH: Hashable {
    @usableFromInline let bits: UInt64
    @inlinable init(_ bits: UInt64) { self.bits = bits }
    public func hash(into h: inout Hasher) { h.combine(bits) }
    @inlinable public func _rawHashValue(seed: Int) -> Int { Int(bitPattern: UInt(truncatingIfNeeded: jsMix(bits ^ UInt64(bitPattern: Int64(seed))))) }
}

/// MurmurHash3's 64-bit finalizer: every input bit moves every output bit (Dictionary probes by the low bits).
@inlinable @inline(__always) func jsMix(_ x: UInt64) -> UInt64 {
    var z = x
    z ^= z >> 33
    z &*= 0xff51_afd7_ed55_8ccd
    z ^= z >> 33
    z &*= 0xc4ce_b9fe_1a85_ec53
    z ^= z >> 33
    return z
}

/// Bytes hashed 8 at a time (multiply-rotate, FxHash's step), then mixed: for map keys from the app (not hostile).
@usableFromInline func jsHashBytes(_ b: UnsafeBufferPointer<UInt8>, _ seed: UInt64) -> UInt64 {
    var h = seed ^ UInt64(b.count) &* 0x9E37_79B9_7F4A_7C15
    guard let p = b.baseAddress.map(UnsafeRawPointer.init) else { return jsMix(h) }
    var i = 0
    while i + 8 <= b.count {
        h = ((h << 5) | (h >> 59)) ^ p.loadUnaligned(fromByteOffset: i, as: UInt64.self)
        h &*= 0x517c_c1b7_2722_0a95
        i += 8
    }
    if i < b.count {
        var w: UInt64 = 0
        for j in i..<b.count { w |= UInt64(b[j]) << (UInt64(j - i) * 8) }
        h = (((h << 5) | (h >> 59)) ^ w) &* 0x517c_c1b7_2722_0a95
    }
    return jsMix(h)
}

/// A `Record<string, T>` (see above): a reference, as a JavaScript object is, so every variable, field or closure
/// holding it sees the same entries. Storage access is unchecked, as JsArray's: no access here overlaps another.
public final class JsMap<Value>: ExpressibleByDictionaryLiteral {
    @exclusivity(unchecked) private var slots: [JsKey: Int] = [:]
    @exclusivity(unchecked) private var entries: [(key: String, value: Value)?] = []

    public init() {}
    public init(dictionaryLiteral elements: (String, Value)...) { for (k, v) in elements { self[k] = v } }
    public init(_ dictionary: [String: Value]) { for (k, v) in dictionary { self[k] = v } }

    public subscript(key: String) -> Value? {
        get { slots[JsKey(key)].map { entries[$0]!.value } }
        set {
            guard let value = newValue else { removeValue(forKey: key); return }
            if let i = slots[JsKey(key)] { entries[i]!.value = value } else { slots[JsKey(key)] = entries.count; entries.append((key, value)) }
        }
    }

    @discardableResult public func removeValue(forKey key: String) -> Value? {
        guard let i = slots.removeValue(forKey: JsKey(key)) else { return nil }
        let old = entries[i]!.value
        entries[i] = nil
        // Mostly holes: compact, so the entries stay proportional to the keys.
        if entries.count > 16 && slots.count * 2 < entries.count {
            entries = entries.filter { $0 != nil }
            for (i, entry) in entries.enumerated() { slots[JsKey(entry!.key)] = i }
        }
        return old
    }

    /// The entries in JavaScript's order (Object.keys / values / entries, for…in).
    public var jsEntries: [(key: String, value: Value)] {
        let live = entries.compactMap { $0 }
        guard live.contains(where: { jsIsIndex($0.key) }) else { return live }
        return live.filter { jsIsIndex($0.key) }.sorted { UInt32($0.key)! < UInt32($1.key)! } + live.filter { !jsIsIndex($0.key) }
    }
    public var jsKeys: JsArray<String> { JsArray(jsEntries.map { $0.key }) }
    public var jsValues: JsArray<Value> { JsArray(jsEntries.map { $0.value }) }
}

/// An array index ("0" … "4294967294", no leading zero): JavaScript lists such keys first, in numeric order.
public func jsIsIndex(_ key: String) -> Bool {
    guard let n = UInt32(key), n < UInt32.max else { return false }
    return String(n) == key
}

/// A JavaScript array: a shared, mutable reference over Swift's contiguous storage `a`. Every variable, parameter,
/// field, closure or element holding it sees the same elements (no copy on assignment), and `===` is identity.
/// Methods that call back into the app work on a snapshot of `a` (a retain, copied only if the callback changes
/// the array), so a callback touching its own array never overlaps an access to it.
public final class JsArray<Element>: RandomAccessCollection, ExpressibleByArrayLiteral {
    /// Unchecked: no access to `a` here overlaps another (callbacks run on snapshots, arguments are evaluated first),
    /// and Swift's dynamic exclusivity check on every element access would cost a third of a tight loop.
    @exclusivity(unchecked) public var a: [Element]

    @inlinable public init() { a = [] }
    @inlinable public init(_ a: [Element]) { self.a = a }
    @inlinable public init<S: Sequence>(_ s: S) where S.Element == Element { a = Array(s) }
    @inlinable public init(arrayLiteral elements: Element...) { a = elements }

    public typealias Index = Int
    public typealias Indices = Range<Int>
    @inlinable public var startIndex: Int { 0 }
    @inlinable public var endIndex: Int { a.count }
    @inlinable public var count: Int { a.count }
    @inlinable public var isEmpty: Bool { a.isEmpty }
    @inlinable public func index(after i: Int) -> Int { i + 1 }
    @inlinable public func index(before i: Int) -> Int { i - 1 }

    /// `xs[i]` (checked in range) and `xs[i] = v`; `xs[xs.length] = v` appends, as in JavaScript.
    @inlinable public subscript(i: Int) -> Element {
        get {
            if i < 0 || i >= a.count { jsTrapIndex(i, a.count) }
            return a[i]
        }
        set { if i == a.count { a.append(newValue) } else { a[i] = newValue } }
    }

    /// `for…of`: live, as JavaScript's array iterator, so elements pushed during the loop are visited.
    public struct Iterator: IteratorProtocol {
        @usableFromInline let array: JsArray
        @usableFromInline var i = 0
        @inlinable init(array: JsArray) { self.array = array }
        @inlinable public mutating func next() -> Element? {
            guard i < array.a.count else { return nil }
            defer { i += 1 }
            return array.a[i]
        }
    }
    @inlinable public func makeIterator() -> Iterator { Iterator(array: self) }

    @inlinable public func append(_ x: Element) { a.append(x) }
    /// `xs.push(...ys)`: `ys` may be `xs` itself, so it is read first.
    @inlinable public func append(contentsOf xs: JsArray<Element>) { let b = xs.a; a.append(contentsOf: b) }
    @inlinable public func insert(_ x: Element, at i: Int) { a.insert(x, at: i) }

    /// `push` / `unshift` as a value: the new length.
    @inlinable public func jsPush(_ x: Element) -> Int { a.append(x); return a.count }
    @inlinable public func jsPush(contentsOf xs: JsArray<Element>) -> Int { append(contentsOf: xs); return a.count }
    @inlinable public func jsUnshift(_ x: Element) -> Int { a.insert(x, at: 0); return a.count }
    @discardableResult @inlinable public func jsPop() -> Element? { a.popLast() }
    @discardableResult @inlinable public func jsShift() -> Element? { a.isEmpty ? nil : a.removeFirst() }

    @discardableResult public func jsSplice(_ start: Int, _ count: Int) -> JsArray<Element> {
        let n = a.count
        let from = start < 0 ? Swift.max(0, n + start) : Swift.min(start, n)
        let to = Swift.min(n, from + Swift.max(0, count))
        let removed = Array(a[from..<to])
        a.removeSubrange(from..<to)
        return JsArray(removed)
    }

    /// `xs[i]` as JavaScript reads it: nil out of range instead of a trap.
    @inlinable public func jsAt(_ i: Int) -> Element? { i >= 0 && i < a.count ? a[i] : nil }
    /// `xs.at(i)`: from the end when negative.
    @inlinable public func jsAtRel(_ i: Int) -> Element? { jsAt(i < 0 ? a.count + i : i) }

    public func jsSlice(_ start: Int, _ end: Int?) -> JsArray<Element> {
        let n = a.count
        let from = start < 0 ? Swift.max(0, n + start) : Swift.min(start, n)
        let to = end.map { $0 < 0 ? Swift.max(0, n + $0) : Swift.min($0, n) } ?? n
        return from < to ? JsArray(Array(a[from..<to])) : JsArray()
    }

    /// `a.concat(b, c)` and spreads (`[...a, x]`): a new array.
    public func jsConcat(_ others: JsArray<Element>...) -> JsArray<Element> {
        var out = a
        out.reserveCapacity(others.reduce(a.count) { $0 + $1.a.count })
        for o in others { out.append(contentsOf: o.a) }
        return JsArray(out)
    }

    /// JavaScript's `sort`, in place (the result is the array itself): stable, and the same merge sort on every
    /// target, so even a comparator that contradicts itself orders the same way everywhere. A positive result puts
    /// `b` first. It sorts a copy and stores it, so the comparator may read the array.
    @discardableResult public func jsSort(_ cmp: (Element, Element) throws -> Double) rethrows -> JsArray<Element> {
        // A stable bottom-up merge sort of indices (no retain / release per move), applied once at the end.
        let x = a
        let count = x.count
        guard count > 1 else { return self }
        var p = [Int](0..<count), q = p
        try x.withUnsafeBufferPointer { xs in
            try p.withUnsafeMutableBufferPointer { pp in
                try q.withUnsafeMutableBufferPointer { qq in
                    var (src, dst) = (pp, qq)
                    var width = 1
                    while width < count {
                        var start = 0
                        while start < count {
                            let mid = Swift.min(start + width, count), end = Swift.min(start + 2 * width, count)
                            var l = start, r = mid, k = start
                            while l < mid && r < end {
                                if try cmp(xs[src[l]], xs[src[r]]) > 0 { dst[k] = src[r]; r += 1 } else { dst[k] = src[l]; l += 1 }
                                k += 1
                            }
                            while l < mid { dst[k] = src[l]; l += 1; k += 1 }
                            while r < end { dst[k] = src[r]; r += 1; k += 1 }
                            start += 2 * width
                        }
                        swap(&src, &dst)
                        width *= 2
                    }
                    if src.baseAddress != pp.baseAddress { pp.baseAddress!.update(from: src.baseAddress!, count: count) }
                }
            }
        }
        a = x.withUnsafeBufferPointer { xs in p.map { xs[$0] } }
        return self
    }

    @discardableResult @inlinable public func jsReverse() -> JsArray<Element> { a.reverse(); return self }

    @inlinable public func map<U>(_ f: (Element) throws -> U) rethrows -> JsArray<U> { let s = a; return JsArray<U>(try s.map(f)) }
    @inlinable public func filter(_ f: (Element) throws -> Bool) rethrows -> JsArray<Element> { let s = a; return JsArray(try s.filter(f)) }
    @inlinable public func forEach(_ f: (Element) throws -> Void) rethrows { let s = a; for x in s { try f(x) } }
    @inlinable public func contains(where f: (Element) throws -> Bool) rethrows -> Bool { let s = a; return try s.contains(where: f) }
    @inlinable public func allSatisfy(_ f: (Element) throws -> Bool) rethrows -> Bool { let s = a; return try s.allSatisfy(f) }
    @inlinable public func first(where f: (Element) throws -> Bool) rethrows -> Element? { let s = a; return try s.first(where: f) }
    @inlinable public func firstIndex(where f: (Element) throws -> Bool) rethrows -> Int? { let s = a; return try s.firstIndex(where: f) }
    @inlinable public func reduce<R>(_ initial: R, _ f: (R, Element) throws -> R) rethrows -> R { let s = a; return try s.reduce(initial, f) }

    public func jsMapI<U>(_ f: (Element, Int) throws -> U) rethrows -> JsArray<U> { let s = a; return JsArray<U>(try s.enumerated().map { try f($0.element, $0.offset) }) }
    public func jsFilterI(_ f: (Element, Int) throws -> Bool) rethrows -> JsArray<Element> { let s = a; return JsArray(try s.enumerated().filter { try f($0.element, $0.offset) }.map { $0.element }) }
    public func jsForEachI(_ f: (Element, Int) throws -> Void) rethrows { let s = a; for (i, x) in s.enumerated() { try f(x, i) } }
    public func jsSomeI(_ f: (Element, Int) throws -> Bool) rethrows -> Bool { let s = a; return try s.enumerated().contains { try f($0.element, $0.offset) } }
    public func jsEveryI(_ f: (Element, Int) throws -> Bool) rethrows -> Bool { let s = a; return try s.enumerated().allSatisfy { try f($0.element, $0.offset) } }
    public func jsFindI(_ f: (Element, Int) throws -> Bool) rethrows -> Element? { let s = a; return try s.enumerated().first { try f($0.element, $0.offset) }?.element }
    public func jsFindIndexI(_ f: (Element, Int) throws -> Bool) rethrows -> Int { let s = a; return try s.enumerated().first { try f($0.element, $0.offset) }?.offset ?? -1 }
}

public extension JsArray where Element == String {
    @inlinable func joined(separator: String) -> String { a.joined(separator: separator) }
}

/// indexOf / includes compare objects (arrays and maps too) by identity, as `===` does. `from`: where the search
/// starts (from the end when negative); lastIndexOf searches back from it.
public extension JsArray where Element: AnyObject {
    @inlinable func jsIndexOf(_ item: Element, _ from: Int = 0) -> Int { a[jsRel(from)...].firstIndex { $0 === item } ?? -1 }
    @inlinable func jsIncludes(_ item: Element, _ from: Int = 0) -> Bool { a[jsRel(from)...].contains { $0 === item } }
    @inlinable func jsLastIndexOf(_ item: Element, _ from: Int = Int.max) -> Int { let k = jsRelLast(from); return k < 0 ? -1 : a[...k].lastIndex { $0 === item } ?? -1 }
}

public extension JsArray where Element: Equatable {
    @inlinable func jsIndexOf(_ item: Element, _ from: Int = 0) -> Int { a[jsRel(from)...].firstIndex(of: item) ?? -1 }
    /// SameValueZero: NaN includes NaN (`x != x` only for NaN), where indexOf's `===` never finds it.
    @inlinable func jsIncludes(_ item: Element, _ from: Int = 0) -> Bool { a[jsRel(from)...].contains { $0 == item || ($0 != $0 && item != item) } }
    @inlinable func jsLastIndexOf(_ item: Element, _ from: Int = Int.max) -> Int { let k = jsRelLast(from); return k < 0 ? -1 : a[...k].lastIndex(of: item) ?? -1 }
}

/// Strings by code units (see jsStrEq), not Swift's canonical equivalence.
public extension JsArray where Element == String {
    @inlinable func jsIndexOf(_ item: String, _ from: Int = 0) -> Int { a[jsRel(from)...].firstIndex { jsStrEq($0, item) } ?? -1 }
    @inlinable func jsIncludes(_ item: String, _ from: Int = 0) -> Bool { a[jsRel(from)...].contains { jsStrEq($0, item) } }
    @inlinable func jsLastIndexOf(_ item: String, _ from: Int = Int.max) -> Int { let k = jsRelLast(from); return k < 0 ? -1 : a[...k].lastIndex { jsStrEq($0, item) } ?? -1 }
}

/// Array APIs: splice with items, fill, copyWithin, flat, reduceRight, `new Array(n).fill(v)`, `Array.from({ length: n }, f)`.
public extension JsArray {
    /// A relative index (`fill`, `copyWithin`, `splice`, `indexOf`'s start): from the end when negative, clamped to 0…count.
    @inlinable func jsRel(_ i: Int) -> Int { i < 0 ? Swift.max(0, a.count + i) : Swift.min(i, a.count) }
    /// `lastIndexOf`'s start: the last index searched (negative: none).
    @inlinable func jsRelLast(_ i: Int) -> Int { i < 0 ? a.count + i : Swift.min(i, a.count - 1) }

    /// `splice(start, count, ...items)`: `items` may be the array itself, so it is read first.
    @discardableResult func jsSplice(_ start: Int, _ count: Int, _ items: JsArray<Element>) -> JsArray<Element> {
        let b = items.a
        let from = jsRel(start), to = from + Swift.min(Swift.max(0, count), a.count - from)
        let removed = JsArray(Array(a[from..<to]))
        a.replaceSubrange(from..<to, with: b)
        return removed
    }
    @discardableResult func jsFill(_ v: Element, _ start: Int, _ end: Int?) -> JsArray<Element> {
        let from = jsRel(start), to = end.map(jsRel) ?? a.count
        var i = from
        while i < to { a[i] = v; i += 1 }
        return self
    }
    @discardableResult func jsCopyWithin(_ target: Int, _ start: Int, _ end: Int?) -> JsArray<Element> {
        let t = jsRel(target), s = jsRel(start), n = Swift.min((end.map(jsRel) ?? a.count) - s, a.count - t)
        if n > 0 { let b = Array(a[s..<s + n]); a.replaceSubrange(t..<t + n, with: b) }
        return self
    }
    /// `flat()` of a `T[][]`: one level.
    func jsFlat<U>() -> JsArray<U> where Element == JsArray<U> {
        var out: [U] = []
        out.reserveCapacity(a.reduce(0) { $0 + $1.a.count })
        for x in a { out.append(contentsOf: x.a) }
        return JsArray<U>(out)
    }
    func jsReduceRight<R>(_ initial: R, _ f: (R, Element) throws -> R) rethrows -> R { let s = a; return try s.reversed().reduce(initial, f) }
    static func jsFilled(_ n: Int, _ v: Element) -> JsArray<Element> { JsArray(Array(repeating: v, count: Swift.max(0, n))) }
    static func jsFrom(length n: Int, _ f: (Int) throws -> Element) rethrows -> JsArray<Element> { JsArray(try (0..<Swift.max(0, n)).map(f)) }

    // ES2023.
    func jsFindLast(_ f: (Element, Int) throws -> Bool) rethrows -> Element? {
        let s = a
        var i = s.count - 1
        while i >= 0 { if try f(s[i], i) { return s[i] }; i -= 1 }
        return nil
    }
    func jsFindLastIndex(_ f: (Element, Int) throws -> Bool) rethrows -> Int {
        let s = a
        var i = s.count - 1
        while i >= 0 { if try f(s[i], i) { return i }; i -= 1 }
        return -1
    }
    func jsToSpliced(_ start: Int, _ count: Int, _ items: JsArray<Element>? = nil) -> JsArray<Element> {
        let out = JsArray(a)
        out.jsSplice(start, count, items ?? JsArray())
        return out
    }
    /// `with(i, v)`: a RangeError out of range, as JavaScript throws.
    func jsWith(_ i: Double, _ v: Element) throws -> JsArray<Element> {
        let t = i.isNaN ? 0 : i.rounded(.towardZero)
        let k = t < 0 ? Double(a.count) + t : t
        guard k >= 0 && k < Double(a.count) else { throw NError(name: "RangeError", "Array index out of range") }
        var b = a
        b[Int(k)] = v
        return JsArray(b)
    }
    /// `new Array(n).fill(v)` of a length not known statically: a RangeError unless it is a whole number below 2^32.
    static func jsFilledChecked(_ n: Double, _ v: Element) throws -> JsArray<Element> { jsFilled(try jsArrayLength(n), v) }
}

/// `++x` / `x++` inside an expression.
public func jsPreIncr(_ x: inout Int, _ d: Int) -> Int { x += d; return x }
public func jsPreIncr(_ x: inout Double, _ d: Double) -> Double { x += d; return x }
public func jsPostIncr(_ x: inout Int, _ d: Int) -> Int { let v = x; x += d; return v }
public func jsPostIncr(_ x: inout Double, _ d: Double) -> Double { let v = x; x += d; return v }

/// ToInt32, which the bitwise operators apply to their operands.
public func jsI32(_ x: Int) -> Int32 { Int32(truncatingIfNeeded: x) }
public func jsI32(_ x: Double) -> Int32 {
    if Swift.abs(x) < 9.2e18 { return Int32(truncatingIfNeeded: Int64(x)) }  // trunc commutes with mod 2^32: no fmod
    guard x.isFinite else { return 0 }
    return Int32(truncatingIfNeeded: Int64(x.truncatingRemainder(dividingBy: 4294967296)))
}

public func jsSign(_ x: Double) -> Double { x > 0 ? 1 : x < 0 ? -1 : x }

/// `x ** y` / `Math.pow` as JavaScriptCore (bun) computes them: a whole exponent 0…1000 by binary powering (C's pow
/// rounds differently: 1.07 ** 10), anything else by pow; NaN where JavaScript differs from C (`1 ** Infinity`, `x ** NaN`).
@inlinable public func jsPow(_ x: Double, _ y: Double) -> Double {
    if y.isNaN || (Swift.abs(x) == 1 && y.isInfinite) { return .nan }
    if y >= 0 && y <= 1000 && y == y.rounded(.towardZero) {
        var r = 1.0, b = x, e = Int(y)
        while e != 0 { if e & 1 != 0 { r *= b }; b *= b; e >>= 1 }
        return r
    }
    return Foundation.pow(x, y)
}

/// `===` on strings: the same code units (Swift's `==` equates canonically equivalent text: "é" and "e\u{301}").
@inlinable public func jsStrEq(_ a: String, _ b: String) -> Bool {
    let n = a.utf8.count
    guard n == b.utf8.count else { return false }
    if n == 0 { return true }
    let same = a.utf8.withContiguousStorageIfAvailable { pa in b.utf8.withContiguousStorageIfAvailable { pb in memcmp(pa.baseAddress!, pb.baseAddress!, n) == 0 } }
    if let same, let same { return same }
    return a.utf8.elementsEqual(b.utf8)
}
@inlinable public func jsStrEq(_ a: String?, _ b: String?) -> Bool {
    guard let a, let b else { return a == nil && b == nil }
    return jsStrEq(a, b)
}
public func jsIsInteger(_ x: Double) -> Bool { x.isFinite && x.rounded(.towardZero) == x }

/// JavaScript's white space and line terminators, which trim() removes.
private func jsIsSpace(_ u: UInt16) -> Bool {
    switch u {
    case 0x09...0x0D, 0x20, 0xA0, 0x1680, 0x2000...0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF: return true
    default: return false
    }
}

/// Strings as JavaScript sees them: sequences of UTF-16 units (lengths, indices, order).
public extension String {
    var jsLength: Int { utf16.count }

    private static func jsFrom(_ units: ArraySlice<UInt16>) -> String { String(decoding: units, as: UTF16.self) }

    /// Fast path: `f` over the UTF-8 bytes when the text is ASCII (a UTF-16 offset is then a byte offset), else nil.
    /// O(1) for native strings (the ASCII flag; no copy), where the generic paths below copy every unit.
    @inline(__always) func jsAscii<R>(_ f: (UnsafeBufferPointer<UInt8>) -> R) -> R? {
        var s = self
        guard s.utf8.count == s.utf16.count else { return nil }
        return s.withUTF8(f)
    }

    // By code units, as JavaScript: Swift's hasPrefix / contains match whole characters ("👨‍👩‍👧" doesn't start
    // with "👨" there) and equate canonically equivalent text, and `contains("")` is false.
    func jsStartsWith(_ s: String) -> Bool { utf8.starts(with: s.utf8) }
    func jsEndsWith(_ s: String) -> Bool { utf8.count >= s.utf8.count && utf8.dropFirst(utf8.count - s.utf8.count).elementsEqual(s.utf8) }
    func jsIncludes(_ s: String) -> Bool { s.isEmpty || jsIndexOf(s) >= 0 }
    /// Swift's lowercased() lacks the final-sigma rule ("ΣΑΣ" is "σας").
    func jsLower() -> String { unicodeScalars.contains("\u{3A3}") ? (self as NSString).lowercased : lowercased() }

    func jsTrim() -> String {
        if let r = jsAscii({ b -> String in
            var i = 0, e = b.count
            while i < e && jsIsSpace(UInt16(b[i])) { i += 1 }
            while e > i && jsIsSpace(UInt16(b[e - 1])) { e -= 1 }
            return i == 0 && e == b.count ? self : String(decoding: UnsafeBufferPointer(rebasing: b[i..<e]), as: UTF8.self)
        }) { return r }
        return jsTrimEnd().jsTrimStart()
    }
    func jsTrimStart() -> String { String.jsFrom(Array(utf16).drop { jsIsSpace($0) }) }
    func jsTrimEnd() -> String {
        let units = Array(utf16)
        var end = units.count
        while end > 0 && jsIsSpace(units[end - 1]) { end -= 1 }
        return String.jsFrom(units[0..<end])
    }

    func jsSlice(_ start: Int, _ end: Int?) -> String {
        if let r = jsAscii({ b -> String in
            let n = b.count
            let from = start < 0 ? Swift.max(0, n + start) : Swift.min(start, n)
            let to = end.map { $0 < 0 ? Swift.max(0, n + $0) : Swift.min($0, n) } ?? n
            return from < to ? String(decoding: UnsafeBufferPointer(rebasing: b[from..<to]), as: UTF8.self) : ""
        }) { return r }
        return String.jsFrom(ArraySlice(JsArray(Array(utf16)).jsSlice(start, end).a))
    }

    func jsIndexOf(_ s: String, _ from: Int = 0) -> Int {
        if let r = jsAscii({ h in s.jsAscii { n in jsFindBytes(h, n, from) } ?? -1 }) { return r }
        let h = Array(utf16), n = Array(s.utf16)
        var i = Swift.max(0, Swift.min(from, h.count))
        while i + n.count <= h.count {
            if h[i..<(i + n.count)].elementsEqual(n) { return i }
            i += 1
        }
        return -1
    }

    func jsLastIndexOf(_ s: String) -> Int {
        if let r = jsAscii({ h in
            s.jsAscii { n -> Int in
                var i = h.count - n.count
                while i >= 0 {
                    if n.isEmpty || memcmp(h.baseAddress! + i, n.baseAddress!, n.count) == 0 { return i }
                    i -= 1
                }
                return -1
            } ?? -1
        }) { return r }
        let h = Array(utf16), n = Array(s.utf16)
        var i = h.count - n.count
        while i >= 0 {
            if h[i..<(i + n.count)].elementsEqual(n) { return i }
            i -= 1
        }
        return -1
    }

    func jsSplit(_ sep: String) -> JsArray<String> {
        if !sep.isEmpty, let r = jsAscii({ h in
            sep.jsAscii { n -> JsArray<String> in
                var parts: [String] = [], start = 0
                while true {
                    let i = jsFindBytes(h, n, start)
                    if i < 0 { break }
                    parts.append(String(decoding: UnsafeBufferPointer(rebasing: h[start..<i]), as: UTF8.self))
                    start = i + n.count
                }
                parts.append(String(decoding: UnsafeBufferPointer(rebasing: h[start...]), as: UTF8.self))
                return JsArray(parts)
            }
        }), let r { return r }
        let h = Array(utf16), n = Array(sep.utf16)
        if n.isEmpty { return JsArray(h.map { String.jsFrom([$0]) }) }
        var parts: [String] = [], start = 0, i = 0
        while i + n.count <= h.count {
            if h[i..<(i + n.count)].elementsEqual(n) {
                parts.append(String.jsFrom(h[start..<i]))
                i += n.count
                start = i
            } else { i += 1 }
        }
        parts.append(String.jsFrom(h[start..<h.count]))
        return JsArray(parts)
    }

    /// `replace` / `replaceAll` with a string pattern, `$$ $& $` $'` in the replacement included.
    func jsReplace(_ pattern: String, _ replacement: String, all: Bool) -> String {
        let h = Array(utf16), n = Array(pattern.utf16), r = Array(replacement.utf16)
        // Where the pattern matches: left to right, not overlapping (an empty one between every unit).
        var matches: [Int] = []
        var i = 0
        while i + n.count <= h.count {
            if h[i..<(i + n.count)].elementsEqual(n) {
                matches.append(i)
                if !all { break }
                i += Swift.max(n.count, 1)
            } else { i += 1 }
        }
        var out: [UInt16] = [], last = 0
        for at in matches {
            out += h[last..<at]
            var j = 0
            while j < r.count {
                if r[j] == 36, j + 1 < r.count, [36, 38, 96, 39].contains(r[j + 1]) {
                    switch r[j + 1] {
                    case 36: out.append(36)
                    case 38: out += n
                    case 96: out += h[0..<at]
                    default: out += h[(at + n.count)...]
                    }
                    j += 2
                } else {
                    out.append(r[j])
                    j += 1
                }
            }
            last = at + n.count
        }
        out += h[last...]
        return String(decoding: out, as: UTF16.self)
    }

    func jsPad(_ length: Int, _ fill: String, atStart: Bool) -> String {
        let units = Array(utf16), f = Array(fill.utf16)
        if length <= units.count || f.isEmpty { return self }
        var pad: [UInt16] = []
        while pad.count < length - units.count { pad.append(f[pad.count % f.count]) }
        return String(decoding: atStart ? pad + units : units + pad, as: UTF16.self)
    }

    func jsRepeat(_ n: Int) -> String { String(repeating: self, count: Swift.max(0, n)) }
}

/// The first `n` in `h` at or after `from` (clamped), -1 if none: memchr for the first byte, then memcmp.
@usableFromInline func jsFindBytes(_ h: UnsafeBufferPointer<UInt8>, _ n: UnsafeBufferPointer<UInt8>, _ from: Int) -> Int {
    var i = Swift.max(0, Swift.min(from, h.count))
    if n.isEmpty { return i }
    let last = h.count - n.count
    guard let hb = h.baseAddress, let nb = n.baseAddress else { return -1 }
    while i <= last {
        guard let p = memchr(hb + i, Int32(nb[0]), last - i + 1) else { return -1 }
        i = hb.distance(to: p.assumingMemoryBound(to: UInt8.self))
        if memcmp(hb + i, nb, n.count) == 0 { return i }
        i += 1
    }
    return -1
}

/// `a < b` on strings: UTF-16 units in order, as JavaScript compares (not Swift's Unicode order).
public func jsCompare(_ a: String, _ b: String) -> Int {
    a.utf16.elementsEqual(b.utf16) ? 0 : a.utf16.lexicographicallyPrecedes(b.utf16) ? -1 : 1
}

// MARK: - String and number APIs (js.fn): positions are UTF-16 units, converted as JavaScript converts them

/// ToIntegerOrInfinity: NaN is 0, a fraction truncates.
@inline(__always) private func jsPos(_ d: Double) -> Double { d.isNaN ? 0 : d.rounded(.towardZero) }
/// A position clamped to 0...len.
@inline(__always) private func jsClampPos(_ d: Double, _ len: Int) -> Int { let p = jsPos(d); return p <= 0 ? 0 : p >= Double(len) ? len : Int(p) }
private func jsUnitAt(_ s: String, _ i: Double) -> UInt16? {
    let p = jsPos(i), u = s.utf16
    guard p >= 0 && p < Double(u.count) else { return nil }
    return u[u.index(u.startIndex, offsetBy: Int(p))]
}
public func jsCharAt(_ s: String, _ i: Double) -> String { jsUnitAt(s, i).map { String(decoding: [$0], as: UTF16.self) } ?? "" }
public func jsCharCodeAt(_ s: String, _ i: Double) -> Double { jsUnitAt(s, i).map { Double($0) } ?? .nan }
public func jsCodePointAt(_ s: String, _ i: Double) -> Double? {
    let p = jsPos(i), u = Array(s.utf16)
    guard p >= 0 && p < Double(u.count) else { return nil }
    let k = Int(p), a = Int(u[k])
    if a >= 0xD800 && a < 0xDC00 && k + 1 < u.count && u[k + 1] >= 0xDC00 && u[k + 1] < 0xE000 { return Double((a - 0xD800) << 10 + Int(u[k + 1]) - 0xDC00 + 0x10000) }
    return Double(a)
}
public func jsStrAt(_ s: String, _ i: Double) -> String? {
    let n = Double(s.utf16.count), p = jsPos(i), k = p < 0 ? n + p : p
    return k >= 0 && k < n ? jsCharAt(s, k) : nil
}
/** `s[i]`: the UTF-16 unit at an integer index in range, else undefined (rest). */
public func jsStrIndex(_ s: String, _ i: Double) -> String? {
    i >= 0 && i == i.rounded(.towardZero) && i < Double(s.utf16.count) ? jsCharAt(s, i) : nil
}
/** `for (const c of s)`, `[...s]`, `Array.from(s)`: code points (rest). */
public func jsCodePoints(_ s: String) -> JsArray<String> { JsArray(s.unicodeScalars.map { String($0) }) }
/** `xs.reduce(f)` without an initial value: index `i` of the start, or JavaScript's TypeError on an empty array (rest). */
public func jsReduceStart(_ n: Int, _ i: Int) throws -> Int {
    if n == 0 { throw NError(name: "TypeError", "Reduce of empty array with no initial value") }
    return i
}
/**
 * `Math.hypot(…)` of any count, as JavaScriptCore computes it (rest): 2 → libm hypot; 3 → libc++'s std::hypot(x, y, z)
 * (scaled sum of squares); more → a running maximum with fused multiply-adds. Infinity wins over NaN.
 */
public func jsHypotN(_ xs: JsArray<Double>) -> Double {
    let v = xs.a
    if v.contains(where: { $0.isInfinite }) { return .infinity }
    if v.count == 0 { return 0 }
    if v.count == 1 { return Swift.abs(v[0]) }
    if v.contains(where: { $0.isNaN }) { return .nan }
    if v.count == 2 { return Foundation.hypot(v[0], v[1]) }
    if v.count == 3 {
        let m = Swift.max(Swift.abs(v[0]), Swift.max(Swift.abs(v[1]), Swift.abs(v[2])))
        let th = 0x1p512, sc = m > th ? 0x1p-532 : m < 1 / th ? 1 / 0x1p-532 : 1.0
        let (x, y, z) = (v[0] * sc, v[1] * sc, v[2] * sc)
        return (x * x + y * y + z * z).squareRoot() / sc
    }
    var m = 0.0, sum = 0.0
    for x in v {
        let a = Swift.abs(x)
        if m < a { let r = m / a; sum = 1.0.addingProduct(sum, r * r); m = a }
        else if m != 0 { let r = a / m; sum = sum.addingProduct(r, r) }
    }
    return m == 0 ? 0 : sum.squareRoot() * m
}
private let jsUriUnreserved = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()".utf8)
private let jsUriReserved = Set(";/?:@&=+$,#".utf8)
private func jsUriEncode(_ s: String, _ keepReserved: Bool) -> String {
    let hex = Array("0123456789ABCDEF".utf8)
    var out: [UInt8] = []
    for b in s.utf8 {
        if jsUriUnreserved.contains(b) || (keepReserved && jsUriReserved.contains(b)) { out.append(b) } else { out += [37, hex[Int(b >> 4)], hex[Int(b & 15)]] }
    }
    return String(decoding: out, as: UTF8.self)
}
/** `encodeURIComponent(s)` / `encodeURI(s)` (rest): UTF-8, uppercase hex (a Swift string has no lone surrogate to reject). */
public func jsEncodeUriComponent(_ s: String) -> String { jsUriEncode(s, false) }
public func jsEncodeUri(_ s: String) -> String { jsUriEncode(s, true) }
private func jsUriDecode(_ s: String, _ keepReserved: Bool) throws -> String {
    let u = Array(s.utf8)
    func bad() -> NError { NError(name: "URIError", "URI error") }
    func hex(_ c: UInt8) -> Int? { c >= 48 && c <= 57 ? Int(c) - 48 : c >= 65 && c <= 70 ? Int(c) - 55 : c >= 97 && c <= 102 ? Int(c) - 87 : nil }
    func byte(_ i: Int) throws -> UInt8 {
        guard i + 2 < u.count, u[i] == 37, let h = hex(u[i + 1]), let l = hex(u[i + 2]) else { throw bad() }
        return UInt8(h * 16 + l)
    }
    var out: [UInt8] = []
    var i = 0
    while i < u.count {
        if u[i] != 37 { out.append(u[i]); i += 1; continue }
        let b = try byte(i)
        if b < 0x80 {
            if keepReserved && jsUriReserved.contains(b) { out += u[i..<(i + 3)] } else { out.append(b) }
            i += 3
            continue
        }
        let n = b & 0xE0 == 0xC0 ? 2 : b & 0xF0 == 0xE0 ? 3 : b & 0xF8 == 0xF0 ? 4 : 0
        if n == 0 { throw bad() }
        var seq = [b]
        for k in 1..<n {
            let c = try byte(i + 3 * k)
            if c & 0xC0 != 0x80 { throw bad() }
            seq.append(c)
        }
        // Overlong forms, surrogates and code points past U+10FFFF are errors, as in JavaScript.
        if String(bytes: seq, encoding: .utf8) == nil { throw bad() }
        out += seq
        i += 3 * n
    }
    return String(decoding: out, as: UTF8.self)
}
/** `decodeURIComponent(s)` / `decodeURI(s)` (rest): a URIError on a malformed escape, as JavaScript. */
public func jsDecodeUriComponent(_ s: String) throws -> String { try jsUriDecode(s, false) }
public func jsDecodeUri(_ s: String) throws -> String { try jsUriDecode(s, true) }
public func jsSubstring(_ s: String, _ a: Double, _ b: Double) -> String {
    let u = Array(s.utf16), x = jsClampPos(a, u.count), y = jsClampPos(b, u.count)
    return String(decoding: u[Swift.min(x, y)..<Swift.max(x, y)], as: UTF16.self)
}
public func jsSubstr(_ s: String, _ start: Double, _ length: Double) -> String {
    let u = Array(s.utf16), n = Double(u.count)
    var p = jsPos(start)
    if p < 0 { p = Swift.max(n + p, 0) }
    p = Swift.min(p, n)
    let l = Swift.min(Swift.max(jsPos(length), 0), n - p)
    return l <= 0 ? "" : String(decoding: u[Int(p)..<Int(p + l)], as: UTF16.self)
}
/// ToUint16.
private func jsU16(_ d: Double) -> UInt16 { d.isFinite ? UInt16(truncatingIfNeeded: Int64(d.truncatingRemainder(dividingBy: 65536))) : 0 }
public func jsFromCharCode(_ codes: Double...) -> String { String(decoding: codes.map(jsU16), as: UTF16.self) }
/// One code (the usual call): no array; ASCII straight to a small string.
public func jsFromCharCode(_ code: Double) -> String {
    let u = jsU16(code)
    return u < 0x80 ? String(Character(Unicode.Scalar(UInt8(u)))) : String(decoding: CollectionOfOne(u), as: UTF16.self)
}
public func jsFromCharCodes(_ codes: JsArray<Double>) -> String { String(decoding: codes.a.map(jsU16), as: UTF16.self) }
public func jsFromCodePoint(_ points: Double...) throws -> String { try jsFromCodePointList(points) }
public func jsFromCodePoints(_ points: JsArray<Double>) throws -> String { try jsFromCodePointList(points.a) }
private func jsFromCodePointList(_ points: [Double]) throws -> String {
    var u: [UInt16] = []
    for c in points {
        guard c >= 0 && c <= 0x10FFFF && c.rounded(.towardZero) == c else { throw NError(name: "RangeError", "Arguments contain a value that is out of range of code points") }
        let v = Int(c)
        if v < 0x10000 { u.append(UInt16(v)) } else { u.append(UInt16(0xD800 + (v - 0x10000) >> 10)); u.append(UInt16(0xDC00 + (v - 0x10000) & 0x3FF)) }
    }
    return String(decoding: u, as: UTF16.self)
}
public func jsNormalize(_ s: String, _ form: String) -> String {
    switch form {
    case "NFD": return s.decomposedStringWithCanonicalMapping
    case "NFKC": return s.precomposedStringWithCompatibilityMapping
    case "NFKD": return s.decomposedStringWithCompatibilityMapping
    default: return s.precomposedStringWithCanonicalMapping
    }
}
/// `split(sep, limit)`: at most ToUint32(limit) parts.
public func jsSplitLimit(_ s: String, _ sep: String, _ limit: Double) -> JsArray<String> {
    let lim = Int(UInt32(bitPattern: jsI32(limit))), parts = s.jsSplit(sep)
    return parts.count > lim ? JsArray(Array(parts.a.prefix(lim))) : parts
}
public func jsStartsWithAt(_ s: String, _ t: String, _ pos: Double) -> Bool {
    let h = Array(s.utf16), n = Array(t.utf16), p = jsClampPos(pos, h.count)
    return p + n.count <= h.count && h[p..<(p + n.count)].elementsEqual(n)
}
public func jsEndsWithAt(_ s: String, _ t: String, _ end: Double) -> Bool {
    let h = Array(s.utf16), n = Array(t.utf16), e = jsClampPos(end, h.count)
    return e >= n.count && h[(e - n.count)..<e].elementsEqual(n)
}
public func jsIncludesAt(_ s: String, _ t: String, _ pos: Double) -> Bool { s.jsIndexOf(t, jsClampPos(pos, s.utf16.count)) >= 0 }
public func jsIndexOfFrom(_ s: String, _ t: String, _ pos: Double) -> Int { s.jsIndexOf(t, jsClampPos(pos, s.utf16.count)) }
/// `lastIndexOf(t, from)`: from NaN searches the whole string.
public func jsLastIndexOfFrom(_ s: String, _ t: String, _ from: Double) -> Int {
    let h = Array(s.utf16), n = Array(t.utf16)
    var i = Swift.min(from.isNaN ? h.count : jsClampPos(from, h.count), h.count - n.count)
    while i >= 0 {
        if h[i..<(i + n.count)].elementsEqual(n) { return i }
        i -= 1
    }
    return -1
}

/// `parseFloat(s)`: the longest decimal literal (or Infinity) after white space; NaN if none.
public func jsParseFloat(_ s: String) -> Double {
    let t = Array(s.jsTrimStart().utf8)
    let digit = { (i: Int) in i < t.count && t[i] >= 48 && t[i] <= 57 }
    var i = t.first == 43 || t.first == 45 ? 1 : 0
    if t[i...].starts(with: "Infinity".utf8) { return t.first == 45 ? -.infinity : .infinity }
    var digits = 0
    while digit(i) { i += 1; digits += 1 }
    if i < t.count && t[i] == 46 { i += 1; while digit(i) { i += 1; digits += 1 } }
    if digits == 0 { return .nan }
    var end = i
    if i < t.count && t[i] | 0x20 == 101 {
        var j = i + 1
        if j < t.count && (t[j] == 43 || t[j] == 45) { j += 1 }
        let first = j
        while digit(j) { j += 1 }
        if j > first { end = j }
    }
    return strtod(String(decoding: t[0..<end], as: UTF8.self), nil)
}

/// A finite d >= 0 as m * 2^e.
private func jsDecompose(_ d: Double) -> (Int, Int) {
    let bits = d.bitPattern, be = Int((bits >> 52) & 0x7FF), m = Int(bits & 0xF_FFFF_FFFF_FFFF)
    return be == 0 ? (m, -1074) : (m | 1 << 52, be - 1075)
}
/// printf's `format` of d into a C buffer, handed to `f` (no Foundation String(format:)).
@inline(__always) func jsPrintf<R>(_ format: String, _ precision: Int, _ d: Double, _ f: (UnsafeBufferPointer<UInt8>) -> R) -> R {
    withUnsafeTemporaryAllocation(of: CChar.self, capacity: precision + 360) { buf in
        let n = withVaList([Int32(precision), d]) { vsnprintf(buf.baseAddress!, buf.count, format, $0) }
        return buf.baseAddress!.withMemoryRebound(to: UInt8.self, capacity: buf.count) { f(UnsafeBufferPointer(start: $0, count: Int(n))) }
    }
}
/// `%.(p-1)e` of d: printf's exact, correctly rounded digits (an exact tie to even) and the first's exponent.
private func jsPrintfDigits(_ d: Double, _ p: Int) -> ([UInt8], Int) {
    jsPrintf("%.*e", p - 1, d) { b in
        let e = b.firstIndex(of: 101)!
        var x = 0
        for c in b[(e + 2)...] { x = x * 10 + Int(c - 48) }
        return (b[..<e].filter { $0 != 46 }, b[e + 1] == 45 ? -x : x)
    }
}
/// d (finite, > 0) rounded to p significant digits, half up, from its exact decimal value: the digits and the
/// exponent of the first. printf's digits, except at an exact tie (where it rounds to even): then rounded up by hand.
/// d = m·2^e (m odd): for e < 0 the exact text has x + k + 1 digits (k = -e, the last one a 5), so a tie
/// is x + k == p; an integer below 2^64 is checked by its remainder.
private func jsRoundDigits(_ d: Double, _ p: Int) -> ([UInt8], Int) {
    if d == 0 { return ([UInt8](repeating: 48, count: p), 0) }
    var (m, e) = jsDecompose(d)
    while m & 1 == 0 && e < 0 { m >>= 1; e += 1 }
    let (ds, x) = jsPrintfDigits(d, p)
    let tie: Bool
    if e < 0 {
        let k = -e
        if x + k == p || x - 1 + k == p {
            let (ds2, x2) = jsPrintfDigits(d, p + 1)
            tie = x2 + k == p && ds2.last == 53
        } else { tie = false }
    } else if d < 18446744073709551616.0 {
        let n = UInt64(d)
        var t = 1, q: UInt64 = 1
        while t < 20 && n / q >= 10 { q *= 10; t += 1 }
        if p < t { var r: UInt64 = 1; for _ in 0..<(t - p) { r *= 10 }; tie = n % r == r / 2 } else { tie = false }
    } else { return jsRoundDigitsBig(d, p) }
    if !tie { return (ds, x) }
    // At a tie the p + 1 digits are exact (the last a 5): the first p rounded up. (Not d.nextUp's digits: its gap can
    // pass a digit, 707273840904235.875 → ...236.)
    var (up, ux) = jsPrintfDigits(d, p + 1)
    up.removeLast()
    var i = p - 1
    while i >= 0 && up[i] == 57 { up[i] = 48; i -= 1 }
    if i < 0 { up.insert(49, at: 0); up.removeLast(); ux += 1 } else { up[i] += 1 }
    return (up, ux)
}
/// jsRoundDigits from the exact bignum value (integers from 2^64).
private func jsRoundDigitsBig(_ d: Double, _ p: Int) -> ([UInt8], Int) {
    if d == 0 { return ([UInt8](repeating: 48, count: p), 0) }
    let (m, e) = jsDecompose(d)
    var n = JsBigInt(m), k = -e
    if e >= 0 { n = n << JsBigInt(e) }
    while k > 0 { let c = Swift.min(k, 13); var f = 1; for _ in 0..<c { f *= 5 }; n = n * JsBigInt(f); k -= c }
    var ds = Array(n.toString(10).utf8), x = ds.count - 1 + Swift.min(e, 0)
    if ds.count <= p { return (ds + [UInt8](repeating: 48, count: p - ds.count), x) }
    let up = ds[p] >= 53
    ds.removeLast(ds.count - p)
    if up {
        var i = p - 1
        while i >= 0 && ds[i] == 57 { ds[i] = 48; i -= 1 }
        if i < 0 { ds.insert(49, at: 0); ds.removeLast(); x += 1 } else { ds[i] += 1 }
    }
    return (ds, x)
}
private func jsExpText(_ ds: [UInt8], _ e: Int) -> String {
    String(decoding: ds[0..<1], as: UTF8.self) + (ds.count > 1 ? "." + String(decoding: ds[1...], as: UTF8.self) : "") + "e" + (e >= 0 ? "+" : "-") + String(Swift.abs(e))
}
public func jsToPrecision(_ d: Double, _ precision: Double) throws -> String {
    let p = jsPos(precision)
    if !d.isFinite { return jsNum(d) }
    guard p >= 1 && p <= 100 else { throw NError(name: "RangeError", "toPrecision() argument must be between 1 and 100") }
    let n = Int(p), (ds, e) = jsRoundDigits(Swift.abs(d), n), sign = d < 0 ? "-" : ""
    if e < -6 || e >= n { return sign + jsExpText(ds, e) }
    let t = String(decoding: ds, as: UTF8.self)
    if e == n - 1 { return sign + t }
    if e >= 0 { return sign + t.prefix(e + 1) + "." + t.dropFirst(e + 1) }
    return sign + "0." + String(repeating: "0", count: -(e + 1)) + t
}
public func jsToExponential(_ d: Double, _ digits: Double) throws -> String {
    let f = jsPos(digits)
    if !d.isFinite { return jsNum(d) }
    guard f >= 0 && f <= 100 else { throw NError(name: "RangeError", "toExponential() argument must be between 0 and 100") }
    let (ds, e) = jsRoundDigits(Swift.abs(d), Int(f) + 1)
    return (d < 0 ? "-" : "") + jsExpText(ds, e)
}
/// `toExponential()`: the shortest digits that read back as d (those String(d) has).
public func jsToExponentialAuto(_ d: Double) -> String {
    if !d.isFinite { return jsNum(d) }
    if d == 0 { return "0e+0" }
    var text = "\(Swift.abs(d))", e = 0
    if let k = text.firstIndex(where: { $0 == "e" || $0 == "E" }) { e = Int(text[text.index(after: k)...]) ?? 0; text = String(text[..<k]) }
    let parts = text.split(separator: ".", omittingEmptySubsequences: false)
    var ds = Array((String(parts[0]) + (parts.count > 1 ? String(parts[1]) : "")).utf8), point = parts[0].count + e
    while ds.count > 1 && ds.first == 48 { ds.removeFirst(); point -= 1 }
    while ds.count > 1 && ds.last == 48 { ds.removeLast() }
    return (d < 0 ? "-" : "") + jsExpText(ds, point - 1)
}
/// `toString(radix)`: JavaScriptCore's digits (bun's): the integer part exact, the fraction until the next or previous
/// double would print differently, rounded half to even (NumberPrototype.cpp's toStringWithRadixInternal, exactly).
public func jsToRadix(_ d: Double, _ radixArg: Double) throws -> String {
    let r = jsPos(radixArg)
    guard r >= 2 && r <= 36 else { throw NError(name: "RangeError", "toString() radix argument must be between 2 and 36") }
    let radix = Int(r)
    if radix == 10 || !d.isFinite { return jsNum(d) }
    let n = Swift.abs(d), fp = n - n.rounded(.down)
    var ip = n.rounded(.down)
    if fp == 0 && ip < 4503599627370496 { return String(Int(d), radix: radix) }
    let chars = Array("0123456789abcdefghijklmnopqrstuvwxyz".utf8)
    var frac: [UInt8] = []
    if fp != 0 {
        // Fixed point: every value here is a multiple of 2^-1076.
        let s = 1076, sh = JsBigInt(s)
        func scaled(_ x: Double, _ by: Int) -> JsBigInt { let (m, e) = jsDecompose(x); return JsBigInt(m) << JsBigInt(e + by) }
        let one = JsBigInt(1) << sh, half = JsBigInt(1) << JsBigInt(s - 1), mask = one - JsBigInt(1), big = JsBigInt(radix)
        var f = scaled(fp, s), next = scaled(n.nextUp - n, s - 1), last = scaled(n - n.nextDown, s - 1)
        var digit = ip <= 9007199254740991 && ip.truncatingRemainder(dividingBy: 2) == 1 ? 1 : 0, odd = digit == 1, up = false
        while true {
            if f > half || (f == half && (radix & 1 == 1 ? odd : digit & 1 == 1)) {
                if f + next > one { up = true; break }
            } else if f < last { break }
            f = f * big
            digit = Int((f >> sh).double)
            f = f & mask
            next = next * big
            last = last * big
            frac.append(UInt8(digit))
            if digit & 1 == 1 { odd.toggle() }
        }
        if up {
            while frac.last == UInt8(radix - 1) { frac.removeLast() }
            if frac.isEmpty { ip += 1 } else { frac[frac.count - 1] += 1 }
        } else {
            while frac.last == 0 { frac.removeLast() }
        }
    }
    let whole = ip < 9007199254740992 ? String(Int(ip), radix: radix) : JsBigInt(whole: ip).toString(radix)
    return (d < 0 ? "-" : "") + whole + (frac.isEmpty ? "" : "." + String(decoding: frac.map { chars[Int($0)] }, as: UTF8.self))
}

// MARK: - App delegate

#if canImport(UIKit)

/// The generated `AppDelegate` subclasses this and calls the app's entry point in `start()`.
/// The window is made by the scene delegate below: UIKit requires the scene lifecycle (Mac Catalyst and newer iOS).
@MainActor open class NucloAppDelegate: UIResponder, UIApplicationDelegate {
    public var window: UIWindow?

    open func start() {}

    public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        start()
        return true
    }

    /// Memory pressure: the cycle collector frees every garbage cycle now (a full, indivisible collection).
    public func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
        jsGcCollect()
    }

    public func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
        configuration.delegateClass = NucloSceneDelegate.self
        return configuration
    }

    /// `NUCLO_DUMP=file`: two seconds after launch, writes `text|x|y|width|height` (points, window space) for every label and button.
    func dumpFrames(of window: UIWindow, to path: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            var lines: [String] = []
            func walk(_ view: UIView) {
                let text = (view as? UILabel)?.text ?? (view as? UIButton)?.currentTitle ?? (view as? UITextView)?.text
                if let text, !text.isEmpty {
                    let f = view.convert(view.bounds, to: window)
                    lines.append(String(format: "%@|%.1f|%.1f|%.1f|%.1f", String(text.prefix(24)), f.minX, f.minY, f.width, f.height))
                }
                view.subviews.forEach(walk)
            }
            walk(window)
            try? lines.joined(separator: "\n").write(toFile: path, atomically: true, encoding: .utf8)
        }
    }
}

@MainActor open class NucloSceneDelegate: UIResponder, UIWindowSceneDelegate {
    public var window: UIWindow?

    public func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        #if targetEnvironment(macCatalyst)
        // A phone-sized window, as the GPUI target opens (420 x 780 points).
        windowScene.sizeRestrictions?.minimumSize = CGSize(width: 420, height: 780)
        windowScene.sizeRestrictions?.maximumSize = CGSize(width: 420, height: 780)
        #endif
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = Runtime.shared.root
        window.makeKeyAndVisible()
        self.window = window
        if let delegate = UIApplication.shared.delegate as? NucloAppDelegate {
            delegate.window = window
            if let path = ProcessInfo.processInfo.environment["NUCLO_DUMP"] { delegate.dumpFrames(of: window, to: path) }
        }
    }
}
#else
/// macOS: `@main` calls `main()`, which runs the app: the app's `start()`, then a 420 x 780 window around the root view.
@MainActor open class NucloAppDelegate: NSObject, NSApplicationDelegate {
    public var window: NSWindow?
    private static var keep: NucloAppDelegate?

    public required override init() { super.init() }

    open func start() {}

    public static func main() {
        let delegate = Self()
        keep = delegate
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)
        app.delegate = delegate
        let menu = NSMenu()
        let item = NSMenuItem()
        menu.addItem(item)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        item.submenu = appMenu
        app.mainMenu = menu
        app.run()
    }

    public func applicationDidFinishLaunching(_ notification: Notification) {
        // The app paints a light interface (as the web build does): the platform's controls must match it.
        NSApp.appearance = NSAppearance(named: .aqua)
        start()
        // `NUCLO_SIZE=700x900`: the window's content size at launch (checks of `@media` against the web build).
        let size = ProcessInfo.processInfo.environment["NUCLO_SIZE"]?.split(separator: "x").compactMap { Double($0) }
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: size?.first ?? 420, height: size?.last ?? 780),
            styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false
        )
        window.title = Bundle.main.object(forInfoDictionaryKey: "CFBundleName") as? String ?? ProcessInfo.processInfo.processName
        window.contentView = Runtime.shared.root.view
        window.center()
        window.makeKeyAndOrderFront(nil)
        // No field has the focus until the user gives it one, as on the web.
        window.makeFirstResponder(nil)
        NSApp.activate(ignoringOtherApps: true)
        self.window = window
        let environment = ProcessInfo.processInfo.environment
        if let points = environment["NUCLO_SCROLL"].flatMap(Double.init) { scroll(window, by: CGFloat(points)) }
        if let path = environment["NUCLO_DUMP"] { dumpFrames(of: window, to: path) }
        if let path = environment["NUCLO_SHOT"] { shoot(window, to: path) }
    }

    /// `NUCLO_SCROLL=points`: a second after launch, the shown screen is scrolled by that much, as the wheel would.
    func scroll(_ window: NSWindow, by points: CGFloat) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { MainActor.assumeIsolated {
            @MainActor func find(_ view: NSView) -> ScreenView? {
                if let screen = view as? ScreenView, !screen.isHidden, screen.window != nil { return screen }
                for child in view.subviews { if let found = find(child) { return found } }
                return nil
            }
            guard let root = window.contentView, let screen = find(root) else { return }
            screen.contentOffset = CGPoint(x: 0, y: screen.contentOffset.y + points)
        } }
    }

    public func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    /// `NUCLO_DUMP=file`: two seconds after launch, writes `text|x|y|width|height` (points, content-view space) for every label and text view.
    func dumpFrames(of window: NSWindow, to path: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { MainActor.assumeIsolated {
            guard let root = window.contentView else { return }
            var lines: [String] = []
            @MainActor func walk(_ view: NSView) {
                if view.isHidden { return }
                // The attributed string is what shows (every label sets one): `text` may be an older value.
                let text = (view as? UILabel)?.attributedText?.string ?? (view as? UILabel)?.text ?? (view as? UITextView)?.text
                if let text, !text.isEmpty {
                    let f = view.convert(view.bounds, to: root)
                    lines.append(String(format: "%@|%.1f|%.1f|%.1f|%.1f", String(text.prefix(24)), f.minX, f.minY, f.width, f.height))
                }
                view.subviews.forEach(walk)
            }
            walk(root)
            try? lines.joined(separator: "\n").write(toFile: path, atomically: true, encoding: .utf8)
        } }
    }

    /// `NUCLO_SHOT=file.png`: two seconds after launch, a picture of the content view.
    func shoot(_ window: NSWindow, to path: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            guard let root = window.contentView, let rep = root.bitmapImageRepForCachingDisplay(in: root.bounds) else { return }
            root.cacheDisplay(in: root.bounds, to: rep)
            try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: path))
        }
    }
}
#endif

// MARK: - BigInt and Symbol

/// JavaScript's `bigint`: an arbitrary-precision signed integer. A value that fits in an Int (but Int.min) is held in
/// `small` with `mag` nil, so arithmetic on small values never allocates (overflow-checked Int ops, then the slow path);
/// a larger one keeps its magnitude in `mag` (little-endian 32-bit limbs, no high zero limb) and its sign in `small`
/// (1 or -1). Each value has exactly one representation, so the synthesized `==` and `hash` compare values.
public struct JsBigInt: Hashable, Comparable, CustomStringConvertible, LosslessStringConvertible {
    let small: Int
    let mag: [UInt32]?

    public init(_ v: Int) {
        if v == Int.min { small = -1; mag = [0, 0x8000_0000] } else { small = v; mag = nil }
    }

    /// A literal too big for an Int (decimal digits, maybe with a leading "-").
    public init(literal text: String) { self = JsBigInt(text)! }

    init(neg: Bool, mag m: [UInt32]) {
        var m = m
        while m.last == 0 { m.removeLast() }
        if m.count <= 2 {
            let u = m.isEmpty ? 0 : m.count == 1 ? UInt64(m[0]) : UInt64(m[0]) | UInt64(m[1]) << 32
            if u <= UInt64(Int.max) { small = neg ? -Int(u) : Int(u); mag = nil; return }
        }
        small = neg ? -1 : 1
        mag = m
    }

    var isNeg: Bool { small < 0 }
    var isZero: Bool { mag == nil && small == 0 }
    /// The magnitude as limbs (allocates for a small value).
    var limbs: [UInt32] {
        if let m = mag { return m }
        let u = UInt64(small.magnitude)
        return u == 0 ? [] : u >> 32 == 0 ? [UInt32(u)] : [UInt32(truncatingIfNeeded: u), UInt32(u >> 32)]
    }

    // MARK: Magnitudes

    static func cmpMag(_ a: [UInt32], _ b: [UInt32]) -> Int {
        if a.count != b.count { return a.count < b.count ? -1 : 1 }
        var i = a.count - 1
        while i >= 0 {
            if a[i] != b[i] { return a[i] < b[i] ? -1 : 1 }
            i -= 1
        }
        return 0
    }

    static func addMag(_ a: [UInt32], _ b: [UInt32]) -> [UInt32] {
        let (x, y) = a.count >= b.count ? (a, b) : (b, a)
        var r = [UInt32]()
        r.reserveCapacity(x.count + 1)
        var carry: UInt64 = 0
        for i in 0..<x.count {
            let s = UInt64(x[i]) + (i < y.count ? UInt64(y[i]) : 0) + carry
            r.append(UInt32(truncatingIfNeeded: s))
            carry = s >> 32
        }
        if carry != 0 { r.append(UInt32(carry)) }
        return r
    }

    /// a - b, where a >= b.
    static func subMag(_ a: [UInt32], _ b: [UInt32]) -> [UInt32] {
        var r = [UInt32]()
        r.reserveCapacity(a.count)
        var borrow: Int64 = 0
        for i in 0..<a.count {
            var d = Int64(a[i]) - (i < b.count ? Int64(b[i]) : 0) - borrow
            borrow = d < 0 ? 1 : 0
            if d < 0 { d += 1 << 32 }
            r.append(UInt32(d))
        }
        return r
    }

    static func mulMag(_ a: [UInt32], _ b: [UInt32]) -> [UInt32] {
        if a.isEmpty || b.isEmpty { return [] }
        var r = [UInt32](repeating: 0, count: a.count + b.count)
        for i in 0..<a.count where a[i] != 0 {
            let ai = UInt64(a[i])
            var carry: UInt64 = 0
            for j in 0..<b.count {
                let t = ai * UInt64(b[j]) + UInt64(r[i + j]) + carry
                r[i + j] = UInt32(truncatingIfNeeded: t)
                carry = t >> 32
            }
            r[i + b.count] = UInt32(carry)
        }
        return r
    }

    static func shlMag(_ a: [UInt32], _ n: Int) -> [UInt32] {
        if a.isEmpty { return [] }
        let (limbs, bits) = (n / 32, n % 32)
        var r = [UInt32](repeating: 0, count: limbs)
        r.reserveCapacity(limbs + a.count + 1)
        if bits == 0 { return r + a }
        var carry: UInt32 = 0
        for x in a {
            r.append(x << UInt32(bits) | carry)
            carry = x >> UInt32(32 - bits)
        }
        if carry != 0 { r.append(carry) }
        return r
    }

    static func shrMag(_ a: [UInt32], _ n: Int) -> [UInt32] {
        let (limbs, bits) = (n / 32, n % 32)
        if limbs >= a.count { return [] }
        var r = Array(a[limbs...])
        if bits == 0 { return r }
        for i in 0..<r.count {
            r[i] = r[i] >> UInt32(bits) | (i + 1 < r.count ? r[i + 1] << UInt32(32 - bits) : 0)
        }
        while r.last == 0 { r.removeLast() }
        return r
    }

    /// The quotient and remainder of `a` by a one-limb divisor.
    static func divSmall(_ a: [UInt32], _ d: UInt32) -> ([UInt32], UInt32) {
        var q = [UInt32](repeating: 0, count: a.count)
        var rem: UInt64 = 0
        var i = a.count - 1
        while i >= 0 {
            let cur = rem << 32 | UInt64(a[i])
            q[i] = UInt32(cur / UInt64(d))
            rem = cur % UInt64(d)
            i -= 1
        }
        while q.last == 0 { q.removeLast() }
        return (q, UInt32(rem))
    }

    /// Quotient and remainder of magnitudes (b not empty): Knuth's algorithm D.
    static func divModMag(_ a: [UInt32], _ b: [UInt32]) -> ([UInt32], [UInt32]) {
        if cmpMag(a, b) < 0 { return ([], a) }
        if b.count == 1 {
            let (q, r) = divSmall(a, b[0])
            return (q, r == 0 ? [] : [r])
        }
        let s = b.last!.leadingZeroBitCount
        var v = shlMag(b, s)
        var u = shlMag(a, s)
        while v.count > b.count { v.removeLast() }
        while u.count < a.count + 1 { u.append(0) }
        let n = v.count, m = u.count - n
        var q = [UInt32](repeating: 0, count: m)
        let vTop = UInt64(v[n - 1]), vNext = UInt64(v[n - 2])
        var j = m - 1
        while j >= 0 {
            let num = UInt64(u[j + n]) << 32 | UInt64(u[j + n - 1])
            var qhat = num / vTop
            var rhat = num % vTop
            while qhat > 0xFFFF_FFFF || qhat * vNext > (rhat << 32 | UInt64(u[j + n - 2])) {
                qhat -= 1
                rhat += vTop
                if rhat > 0xFFFF_FFFF { break }
            }
            var borrow: Int64 = 0
            var carry: UInt64 = 0
            for i in 0..<n {
                let p = qhat * UInt64(v[i]) + carry
                carry = p >> 32
                let t = Int64(u[i + j]) - borrow - Int64(p & 0xFFFF_FFFF)
                u[i + j] = UInt32(truncatingIfNeeded: t)
                borrow = t < 0 ? 1 : 0
            }
            let t = Int64(u[j + n]) - borrow - Int64(carry)
            u[j + n] = UInt32(truncatingIfNeeded: t)
            if t < 0 {
                qhat -= 1
                var c: UInt64 = 0
                for i in 0..<n {
                    let s2 = UInt64(u[i + j]) + UInt64(v[i]) + c
                    u[i + j] = UInt32(truncatingIfNeeded: s2)
                    c = s2 >> 32
                }
                u[j + n] = UInt32(truncatingIfNeeded: UInt64(u[j + n]) + c)
            }
            q[j] = UInt32(truncatingIfNeeded: qhat)
            j -= 1
        }
        var r = shrMag(Array(u[0..<n]), s)
        while r.last == 0 { r.removeLast() }
        return (q, r)
    }

    // MARK: Arithmetic

    public static func + (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        if a.mag == nil && b.mag == nil {
            let (s, o) = a.small.addingReportingOverflow(b.small)
            if !o { return JsBigInt(s) }
        }
        if a.isNeg == b.isNeg { return JsBigInt(neg: a.isNeg, mag: addMag(a.limbs, b.limbs)) }
        let (x, y) = (a.limbs, b.limbs)
        return cmpMag(x, y) >= 0 ? JsBigInt(neg: a.isNeg, mag: subMag(x, y)) : JsBigInt(neg: b.isNeg, mag: subMag(y, x))
    }

    public static prefix func - (a: JsBigInt) -> JsBigInt {
        a.mag == nil ? JsBigInt(-a.small) : JsBigInt(neg: !a.isNeg, mag: a.mag!)
    }

    public static func - (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        if a.mag == nil && b.mag == nil {
            let (s, o) = a.small.subtractingReportingOverflow(b.small)
            if !o { return JsBigInt(s) }
        }
        return a + -b
    }

    public static func * (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        if a.mag == nil && b.mag == nil {
            let (p, o) = a.small.multipliedReportingOverflow(by: b.small)
            if !o { return JsBigInt(p) }
        }
        return JsBigInt(neg: a.isNeg != b.isNeg, mag: mulMag(a.limbs, b.limbs))
    }

    /// Truncates toward zero, as JavaScript does. The divisor is not zero (`jsBigDiv` checks).
    public static func / (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        if a.mag == nil && b.mag == nil { return JsBigInt(a.small / b.small) }
        return JsBigInt(neg: a.isNeg != b.isNeg, mag: divModMag(a.limbs, b.limbs).0)
    }

    /// Takes the sign of the dividend, as JavaScript does. The divisor is not zero.
    public static func % (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        if a.mag == nil && b.mag == nil { return JsBigInt(a.small % b.small) }
        return JsBigInt(neg: a.isNeg, mag: divModMag(a.limbs, b.limbs).1)
    }

    /// `a ** b` for b >= 0 (`jsBigPow` checks).
    public static func pow(_ a: JsBigInt, _ b: JsBigInt) -> JsBigInt {
        if b.mag != nil {
            // Only 0, 1 and -1 have a power this large (`jsBigPow` throws for the others).
            if a == JsBigInt(-1) { return b.limbs[0] & 1 == 0 ? JsBigInt(1) : a }
            return a
        }
        var (result, base, e) = (JsBigInt(1), a, b.small)
        while e > 0 {
            if e & 1 == 1 { result = result * base }
            e >>= 1
            if e > 0 { base = base * base }
        }
        return result
    }

    public static func < (a: JsBigInt, b: JsBigInt) -> Bool {
        if a.mag == nil && b.mag == nil { return a.small < b.small }
        if a.isNeg != b.isNeg { return a.isNeg }
        let c = cmpMag(a.limbs, b.limbs)
        return a.isNeg ? c > 0 : c < 0
    }

    // MARK: Bits (two's complement of infinite width, as in JavaScript)

    /// The value as `count` limbs of two's complement.
    func twos(_ count: Int) -> [UInt32] {
        var t = limbs + [UInt32](repeating: 0, count: count - limbs.count)
        if isNeg {
            var carry: UInt64 = 1
            for i in 0..<t.count {
                let s = UInt64(~t[i]) + carry
                t[i] = UInt32(truncatingIfNeeded: s)
                carry = s >> 32
            }
        }
        return t
    }

    static func fromTwos(_ t: [UInt32]) -> JsBigInt {
        guard let top = t.last, top & 0x8000_0000 != 0 else { return JsBigInt(neg: false, mag: t) }
        var m = t
        var carry: UInt64 = 1
        for i in 0..<m.count {
            let s = UInt64(~m[i]) + carry
            m[i] = UInt32(truncatingIfNeeded: s)
            carry = s >> 32
        }
        return JsBigInt(neg: true, mag: m)
    }

    static func bitwise(_ a: JsBigInt, _ b: JsBigInt, _ f: (UInt32, UInt32) -> UInt32) -> JsBigInt {
        let n = max(a.limbs.count, b.limbs.count) + 1
        let (x, y) = (a.twos(n), b.twos(n))
        return fromTwos((0..<n).map { f(x[$0], y[$0]) })
    }

    public static func & (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        a.mag == nil && b.mag == nil ? JsBigInt(a.small & b.small) : bitwise(a, b, &)
    }

    public static func | (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        a.mag == nil && b.mag == nil ? JsBigInt(a.small | b.small) : bitwise(a, b, |)
    }

    public static func ^ (a: JsBigInt, b: JsBigInt) -> JsBigInt {
        a.mag == nil && b.mag == nil ? JsBigInt(a.small ^ b.small) : bitwise(a, b, ^)
    }

    public static prefix func ~ (a: JsBigInt) -> JsBigInt { -a - JsBigInt(1) }

    /// A shift count: past an Int, only the sign matters (no value that big fits in memory).
    var shiftCount: Int { mag == nil ? small : isNeg ? -(1 << 62) : 1 << 62 }

    public static func << (a: JsBigInt, b: JsBigInt) -> JsBigInt { shl(a, b.shiftCount) }
    public static func >> (a: JsBigInt, b: JsBigInt) -> JsBigInt { shl(a, -b.shiftCount) }

    /// `a * 2**n`, rounded toward -Infinity when n < 0.
    static func shl(_ a: JsBigInt, _ n: Int) -> JsBigInt {
        if a.isZero || n == 0 { return a }
        if n > 0 {
            if a.mag == nil && n < 63 {
                let s = a.small << n
                if s >> n == a.small && s != Int.min { return JsBigInt(s) }
            }
            precondition(n < 1 << 32, "RangeError: BigInt too big")
            return JsBigInt(neg: a.isNeg, mag: shlMag(a.limbs, n))
        }
        let m = -n
        if a.mag == nil { return JsBigInt(m >= 64 ? (a.small < 0 ? -1 : 0) : a.small >> m) }
        if !a.isNeg { return JsBigInt(neg: false, mag: shrMag(a.limbs, m)) }
        // floor(-x / 2^m) = -((x - 1) >> m) - 1
        return -JsBigInt(neg: false, mag: shrMag(subMag(a.limbs, [1]), m)) - JsBigInt(1)
    }

    /// `BigInt.asUintN(bits, a)`: a modulo 2^bits.
    public static func asUintN(_ bits: Int, _ a: JsBigInt) -> JsBigInt {
        a & (shl(JsBigInt(1), bits) - JsBigInt(1))
    }

    /// `BigInt.asIntN(bits, a)`: a modulo 2^bits, as a signed value.
    public static func asIntN(_ bits: Int, _ a: JsBigInt) -> JsBigInt {
        if bits == 0 { return JsBigInt(0) }
        let u = asUintN(bits, a)
        return u < shl(JsBigInt(1), bits - 1) ? u : u - shl(JsBigInt(1), bits)
    }

    // MARK: Conversions

    /// `Number(b)`: the nearest Double (ties to even), as JavaScript rounds it.
    public var double: Double {
        guard let m = mag else { return Double(small) }
        let bits = m.count * 32 - m.last!.leadingZeroBitCount
        if bits > 1024 { return isNeg ? -.infinity : .infinity }
        // The top 64 bits, with a sticky low bit for any bit below them: Double(UInt64) then rounds as a whole would.
        let shift = bits - 64
        let top = JsBigInt.shrMag(m, shift)
        var u = UInt64(top[0]) | (top.count > 1 ? UInt64(top[1]) << 32 : 0)
        if JsBigInt.shlMag(top, shift) != m { u |= 1 }
        let d = Double(sign: .plus, exponent: shift, significand: Double(u))
        return isNeg ? -d : d
    }

    /// `BigInt(n)` of a whole Double.
    init(whole d: Double) {
        if Swift.abs(d) < 9.2e18 { self = JsBigInt(Int(d)); return }
        let m = JsBigInt(Int(d.significandBitPattern | 1 << 52))
        let v = JsBigInt.shl(m, Int(d.exponent) - 52)
        self = d < 0 ? -v : v
    }

    public var description: String { toString(10) }

    public func toString(_ radix: Int) -> String {
        guard let m = mag else { return String(small, radix: radix) }
        // Divide by the largest power of the radix that fits in a limb, `k` digits at a time.
        var (chunk, k): (UInt32, Int) = (UInt32(radix), 1)
        while UInt64(chunk) * UInt64(radix) <= UInt64(UInt32.max) { chunk *= UInt32(radix); k += 1 }
        var rest = m
        var parts: [String] = []
        while !rest.isEmpty {
            let (q, r) = JsBigInt.divSmall(rest, chunk)
            let digits = String(r, radix: radix)
            parts.append(q.isEmpty ? digits : String(repeating: "0", count: k - digits.count) + digits)
            rest = q
        }
        return (isNeg ? "-" : "") + parts.reversed().joined()
    }

    /// JavaScript's StringToBigInt: decimal with an optional sign, or 0x / 0o / 0b; surrounding white space; "" is 0.
    public init?(_ text: String) {
        var s = Substring(text.jsTrim())
        if s.isEmpty { self = JsBigInt(0); return }
        var radix = 10
        var neg = false
        if s.count > 2, s.first == "0", let p = s.dropFirst().first, let r = ["x": 16, "X": 16, "o": 8, "O": 8, "b": 2, "B": 2][p] {
            radix = r
            s = s.dropFirst(2)
        } else if s.first == "+" || s.first == "-" {
            neg = s.first == "-"
            s = s.dropFirst()
        }
        if s.isEmpty { return nil }
        var mag: [UInt32] = []
        for c in s.unicodeScalars {
            guard c.isASCII, let d = Int(String(c), radix: radix) else { return nil }
            // mag = mag * radix + d
            var carry = UInt64(d)
            for i in 0..<mag.count {
                let t = UInt64(mag[i]) * UInt64(radix) + carry
                mag[i] = UInt32(truncatingIfNeeded: t)
                carry = t >> 32
            }
            if carry != 0 { mag.append(UInt32(carry)) }
        }
        self = JsBigInt(neg: neg, mag: mag)
    }
}

/// The errors JavaScript's BigInt operations throw (`RangeError`, `SyntaxError`), with JavaScriptCore's messages.
public func jsBigDiv(_ a: JsBigInt, _ b: JsBigInt) throws -> JsBigInt {
    if b.isZero { throw NError(name: "RangeError", "0 is an invalid divisor value.") }
    return a / b
}

public func jsBigMod(_ a: JsBigInt, _ b: JsBigInt) throws -> JsBigInt {
    if b.isZero { throw NError(name: "RangeError", "0 is an invalid divisor value.") }
    return a % b
}

public func jsBigPow(_ a: JsBigInt, _ b: JsBigInt) throws -> JsBigInt {
    if b.isNeg { throw NError(name: "RangeError", "Negative exponent is not allowed") }
    if b.mag != nil && a.mag == nil && Swift.abs(a.small) > 1 || b.mag != nil && a.mag != nil {
        throw NError(name: "RangeError", "Out of memory: BigInt generated from this operation is too big")
    }
    return JsBigInt.pow(a, b)
}

/// `BigInt(n)` of a Double: only a whole number converts.
public func jsBigFrom(_ d: Double) throws -> JsBigInt {
    if !d.isFinite || d.rounded(.towardZero) != d { throw NError(name: "RangeError", "Not an integer") }
    return JsBigInt(whole: d)
}

public func jsBigParse(_ s: String) throws -> JsBigInt {
    guard let v = JsBigInt(s) else { throw NError(name: "SyntaxError", "Failed to parse String to BigInt") }
    return v
}

public func jsBigToString(_ a: JsBigInt, _ radix: Double) throws -> String {
    let radix = radix.rounded(.towardZero)
    guard radix >= 2 && radix <= 36 else { throw NError(name: "RangeError", "toString() radix argument must be between 2 and 36") }
    return a.toString(Int(radix))
}

/// JavaScript's `symbol`: a value only equal to itself (copies share its identity), with an optional description.
/// A struct around the identity, so arrays of symbols take the Equatable overloads (jsIndexOf…) unambiguously.
public struct JsSymbol: Hashable, CustomStringConvertible {
    final class Id {}
    private let id = Id()
    public let desc: String?
    public init(_ desc: String?) { self.desc = desc }
    public static func == (a: JsSymbol, b: JsSymbol) -> Bool { a.id === b.id }
    public func hash(into h: inout Hasher) { h.combine(ObjectIdentifier(id)) }
    public var description: String { "Symbol(\(desc ?? ""))" }
}

// MARK: - Typed arrays

/// An element type of a typed array: how it is stored (`S`), read (`N`: Int for the small integers, Double otherwise)
/// and written (JavaScript's conversions: ToInt8…ToUint32 wrap, Uint8Clamped clamps and rounds half to even, Float32
/// rounds to nearest even).
public protocol JsTAKind {
    associatedtype S
    associatedtype N
    static var zero: S { get }
    static var bytes: Int { get }
    static func num(_ s: S) -> N
    static func dbl(_ s: S) -> Double
    static func from(_ v: Int) -> S
    static func from(_ v: Double) -> S
}
public enum JsTAInt8: JsTAKind {
    public static let zero: Int8 = 0, bytes = 1
    @inline(__always) public static func num(_ s: Int8) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: Int8) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> Int8 { Int8(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> Int8 { Int8(truncatingIfNeeded: jsI32(v)) }
}
public enum JsTAUint8: JsTAKind {
    public static let zero: UInt8 = 0, bytes = 1
    @inline(__always) public static func num(_ s: UInt8) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: UInt8) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> UInt8 { UInt8(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> UInt8 { UInt8(truncatingIfNeeded: jsI32(v)) }
}
public enum JsTAUint8Clamped: JsTAKind {
    public static let zero: UInt8 = 0, bytes = 1
    @inline(__always) public static func num(_ s: UInt8) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: UInt8) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> UInt8 { UInt8(Swift.min(Swift.max(v, 0), 255)) }
    @inline(__always) public static func from(_ v: Double) -> UInt8 { v.isNaN ? 0 : UInt8(Swift.min(Swift.max(v, 0), 255).rounded(.toNearestOrEven)) }
}
public enum JsTAInt16: JsTAKind {
    public static let zero: Int16 = 0, bytes = 2
    @inline(__always) public static func num(_ s: Int16) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: Int16) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> Int16 { Int16(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> Int16 { Int16(truncatingIfNeeded: jsI32(v)) }
}
public enum JsTAUint16: JsTAKind {
    public static let zero: UInt16 = 0, bytes = 2
    @inline(__always) public static func num(_ s: UInt16) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: UInt16) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> UInt16 { UInt16(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> UInt16 { UInt16(truncatingIfNeeded: jsI32(v)) }
}
public enum JsTAInt32: JsTAKind {
    public static let zero: Int32 = 0, bytes = 4
    @inline(__always) public static func num(_ s: Int32) -> Int { Int(s) }
    @inline(__always) public static func dbl(_ s: Int32) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> Int32 { Int32(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> Int32 { jsI32(v) }
}
public enum JsTAUint32: JsTAKind {
    public static let zero: UInt32 = 0, bytes = 4
    @inline(__always) public static func num(_ s: UInt32) -> Double { Double(s) }
    @inline(__always) public static func dbl(_ s: UInt32) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> UInt32 { UInt32(truncatingIfNeeded: v) }
    @inline(__always) public static func from(_ v: Double) -> UInt32 { UInt32(bitPattern: jsI32(v)) }
}
public enum JsTAFloat32: JsTAKind {
    public static let zero: Float = 0, bytes = 4
    @inline(__always) public static func num(_ s: Float) -> Double { Double(s) }
    @inline(__always) public static func dbl(_ s: Float) -> Double { Double(s) }
    @inline(__always) public static func from(_ v: Int) -> Float { Float(Double(v)) }
    @inline(__always) public static func from(_ v: Double) -> Float { Float(v) }
}
public enum JsTAFloat64: JsTAKind {
    public static let zero: Double = 0, bytes = 8
    @inline(__always) public static func num(_ s: Double) -> Double { s }
    @inline(__always) public static func dbl(_ s: Double) -> Double { s }
    @inline(__always) public static func from(_ v: Int) -> Double { Double(v) }
    @inline(__always) public static func from(_ v: Double) -> Double { v }
}
public typealias Int8Array = JsTypedArray<JsTAInt8>
public typealias Uint8Array = JsTypedArray<JsTAUint8>
public typealias Uint8ClampedArray = JsTypedArray<JsTAUint8Clamped>
public typealias Int16Array = JsTypedArray<JsTAInt16>
public typealias Uint16Array = JsTypedArray<JsTAUint16>
public typealias Int32Array = JsTypedArray<JsTAInt32>
public typealias Uint32Array = JsTypedArray<JsTAUint32>
public typealias Float32Array = JsTypedArray<JsTAFloat32>
public typealias Float64Array = JsTypedArray<JsTAFloat64>

/// The packed memory views share (`subarray`).
public final class JsTAStore<S> {
    let p: UnsafeMutablePointer<S>
    /// Elements (an `ArrayBuffer`, a store of bytes, has this many bytes).
    let count: Int
    init(_ count: Int, _ zero: S) {
        self.count = count
        p = .allocate(capacity: Swift.max(count, 1))
        p.initialize(repeating: zero, count: count)
    }
    deinit { p.deallocate() }
}

/// ToIntegerOrInfinity of a relative index, clamped to `0...len` (negative counts from the end).
@inline(__always) func jsTARel(_ d: Double, _ len: Int) -> Int {
    let t = d.isNaN ? 0 : d.rounded(.towardZero)
    return Int(t < 0 ? Swift.max(Double(len) + t, 0) : Swift.min(t, Double(len)))
}

/// A stable merge sort with JavaScript's comparator contract (`cmp(a, b) > 0` puts b first).
func jsMergeSort(_ v: inout [Double], _ cmp: (Double, Double) -> Double) {
    let n = v.count
    var tmp = v
    var width = 1
    while width < n {
        var lo = 0
        while lo < n {
            let mid = Swift.min(lo + width, n), hi = Swift.min(lo + 2 * width, n)
            var i = lo, j = mid, k = lo
            while i < mid && j < hi {
                if cmp(v[j], v[i]) < 0 { tmp[k] = v[j]; j += 1 } else { tmp[k] = v[i]; i += 1 }
                k += 1
            }
            while i < mid { tmp[k] = v[i]; i += 1; k += 1 }
            while j < hi { tmp[k] = v[j]; j += 1; k += 1 }
            lo = hi
        }
        swap(&v, &tmp)
        width *= 2
    }
}

/// A JavaScript typed array: a view (`off`, `length`) over packed storage it may share with other views.
/// A write out of range is ignored; callbacks get each value as a Double (a JavaScript number) and its index.
public final class JsTypedArray<K: JsTAKind>: CustomStringConvertible {
    let store: JsTAStore<K.S>
    let off: Int
    public let length: Int
    @inline(__always) var p: UnsafeMutablePointer<K.S> { store.p + off }

    init(_ store: JsTAStore<K.S>, _ off: Int, _ length: Int) {
        self.store = store; self.off = off; self.length = length
    }
    public static var BYTES_PER_ELEMENT: Int { K.bytes }
    /// `new X(n)`.
    public convenience init(length n: Int) {
        precondition(n >= 0, "RangeError: Invalid typed array length: \(n)")
        self.init(JsTAStore(n, K.zero), 0, n)
    }
    /// `new X(numbers)`, `X.of(…)`, `X.from(numbers)`.
    public convenience init<Q: Sequence>(doubles xs: Q) where Q.Element == Double {
        let v = Array(xs)
        self.init(length: v.count)
        for i in 0..<v.count { p[i] = K.from(v[i]) }
    }
    /// `new X(typedArray)`: each value converted.
    public convenience init<K2>(typed src: JsTypedArray<K2>) {
        self.init(length: src.length)
        for i in 0..<length { p[i] = K.from(src.dbl(i)) }
    }
    @inline(__always) func dbl(_ i: Int) -> Double { K.dbl(p[i]) }
    public var byteLength: Int { length * K.bytes }
    public var byteOffset: Int { off * K.bytes }
    public var description: String { join(",") }

    /// `ta[i]!`: traps out of range, as an array read does.
    @inline(__always) public func get(_ i: Int) -> K.N {
        precondition(i >= 0 && i < length, "typed array index out of range")
        return K.num(p[i])
    }
    /// `ta[i]`: undefined out of range.
    @inline(__always) public func opt(_ i: Int) -> K.N? { i >= 0 && i < length ? K.num(p[i]) : nil }
    /// `ta[i] = v`: ignored out of range.
    @inline(__always) public func put(_ i: Int, _ v: Int) { if i >= 0 && i < length { p[i] = K.from(v) } }
    @inline(__always) public func putD(_ i: Int, _ v: Double) { if i >= 0 && i < length { p[i] = K.from(v) } }
    public func jsAt(_ i: Double) -> K.N? {
        let t = i.isNaN ? 0 : i.rounded(.towardZero)
        let k = t < 0 ? Double(length) + t : t
        return k >= 0 && k < Double(length) ? K.num(p[Int(k)]) : nil
    }
    @discardableResult public func fill(_ v: Double, _ start: Double, _ end: Double) -> JsTypedArray {
        let s = K.from(v), a = jsTARel(start, length), b = jsTARel(end, length)
        if a < b { for i in a..<b { p[i] = s } }
        return self
    }
    public func subarray(_ start: Double, _ end: Double) -> JsTypedArray {
        let a = jsTARel(start, length), b = jsTARel(end, length)
        return JsTypedArray(store, off + a, Swift.max(b, a) - a)
    }
    public func slice(_ start: Double, _ end: Double) -> JsTypedArray {
        let a = jsTARel(start, length), b = jsTARel(end, length)
        let r = JsTypedArray(length: Swift.max(b, a) - a)
        for i in 0..<r.length { r.p[i] = p[a + i] }
        return r
    }
    private func setValues(_ v: [Double], _ offset: Double) {
        let o = offset.isNaN ? 0 : offset.rounded(.towardZero)
        precondition(o >= 0 && o + Double(v.count) <= Double(length), "RangeError: offset is out of bounds")
        for i in 0..<v.count { p[Int(o) + i] = K.from(v[i]) }
    }
    /// `set(numbers, offset)`.
    public func setFrom<Q: Sequence>(_ xs: Q, _ offset: Double) where Q.Element == Double { setValues(Array(xs), offset) }
    /// `set(typedArray, offset)`: read first, so an overlapping view of the same storage copies as if through a temporary.
    public func setFromTa<K2>(_ src: JsTypedArray<K2>, _ offset: Double) { setValues(src.doubles(), offset) }
    @discardableResult public func copyWithin(_ target: Double, _ start: Double, _ end: Double) -> JsTypedArray {
        let t = jsTARel(target, length), s = jsTARel(start, length), e = jsTARel(end, length)
        let count = Swift.min(Swift.max(e - s, 0), length - t)
        if count > 0 { (p + t).update(from: p + s, count: count) }
        return self
    }
    @discardableResult public func reverse() -> JsTypedArray {
        var i = 0, j = length - 1
        while i < j { let x = p[i]; p[i] = p[j]; p[j] = x; i += 1; j -= 1 }
        return self
    }
    private func writeAll(_ v: [Double]) { for i in 0..<v.count { p[i] = K.from(v[i]) } }
    /// `sort()`: numeric, -0 before +0, NaN last.
    @discardableResult public func sortNum() -> JsTypedArray {
        var v = doubles()
        v.sort { a, b in a.isNaN ? false : b.isNaN ? true : a < b || (a == b && a.sign == .minus && b.sign == .plus) }
        writeAll(v)
        return self
    }
    /// `sort(cmp)`: stable.
    @discardableResult public func sortBy(_ cmp: (Double, Double) -> Double) -> JsTypedArray {
        var v = doubles()
        jsMergeSort(&v, cmp)
        writeAll(v)
        return self
    }
    /// `[...ta]`.
    public func toArray() -> JsArray<Double> { JsArray(doubles()) }
    func doubles() -> [Double] { (0..<length).map { dbl($0) } }
    public func indexOf(_ v: Double, _ from: Double) -> Int {
        var i = jsTARel(from, length)
        while i < length { if dbl(i) == v { return i }; i += 1 }
        return -1
    }
    public func lastIndexOf(_ v: Double, _ from: Double) -> Int {
        let t = from.isNaN ? 0 : from.rounded(.towardZero)
        let k = t < 0 ? Double(length) + t : Swift.min(t, Double(length) - 1)
        if k < 0 { return -1 }
        var i = Int(k)
        while i >= 0 { if dbl(i) == v { return i }; i -= 1 }
        return -1
    }
    /// SameValueZero: NaN is found.
    public func includes(_ v: Double, _ from: Double) -> Bool {
        var i = jsTARel(from, length)
        while i < length { let x = dbl(i); if x == v || (x.isNaN && v.isNaN) { return true }; i += 1 }
        return false
    }
    public func join(_ sep: String) -> String { (0..<length).map { jsNum(dbl($0)) }.joined(separator: sep) }
    public func map(_ f: (Double, Int) -> Double) -> JsTypedArray {
        let r = JsTypedArray(length: length)
        for i in 0..<length { r.p[i] = K.from(f(dbl(i), i)) }
        return r
    }
    public func filter(_ f: (Double, Int) -> Bool) -> JsTypedArray {
        var kept: [K.S] = []
        for i in 0..<length where f(dbl(i), i) { kept.append(p[i]) }
        let r = JsTypedArray(length: kept.count)
        for i in 0..<kept.count { r.p[i] = kept[i] }
        return r
    }
    public func forEach(_ f: (Double, Int) -> Void) { for i in 0..<length { f(dbl(i), i) } }
    public func some(_ f: (Double, Int) -> Bool) -> Bool { for i in 0..<length where f(dbl(i), i) { return true }; return false }
    public func every(_ f: (Double, Int) -> Bool) -> Bool { for i in 0..<length where !f(dbl(i), i) { return false }; return true }
    public func find(_ f: (Double, Int) -> Bool) -> K.N? { for i in 0..<length where f(dbl(i), i) { return K.num(p[i]) }; return nil }
    public func findIndex(_ f: (Double, Int) -> Bool) -> Int { for i in 0..<length where f(dbl(i), i) { return i }; return -1 }
    public func reduce<A>(_ initial: A, _ f: (A, Double) -> A) -> A {
        var acc = initial
        for i in 0..<length { acc = f(acc, dbl(i)) }
        return acc
    }
}

// MARK: - Map and Set

/// How a `Map` / `Set` key is hashed: SameValueZero for numbers (NaN is NaN, -0 is +0), code units for strings,
/// value for booleans / bigints / symbols, identity for objects (app classes, arrays, maps).
public protocol JsKeyKind { associatedtype K; associatedtype H: Hashable; static func h(_ k: K) -> H; static func norm(_ k: K) -> K }
public extension JsKeyKind { @inlinable static func norm(_ k: K) -> K { k } }
public enum JsNumK: JsKeyKind {
    @inlinable public static func norm(_ k: Double) -> Double { k == 0 ? 0 : k }
    @inlinable public static func h(_ k: Double) -> JsNumH { JsNumH(k == 0 ? 0 : k.isNaN ? 0x7ff8_0000_0000_0000 : k.bitPattern) }
}
public enum JsIntK: JsKeyKind { @inlinable public static func h(_ k: Int) -> JsNumH { JsNumH(UInt64(bitPattern: Int64(k))) } }
public enum JsStrK: JsKeyKind { @inlinable public static func h(_ k: String) -> JsKey { JsKey(k) } }
public enum JsHashK<T: Hashable>: JsKeyKind { @inlinable public static func h(_ k: T) -> T { k } }
public enum JsRefK<T>: JsKeyKind { @inlinable public static func h(_ k: T) -> ObjectIdentifier { ObjectIdentifier(k as AnyObject) } }

/// JavaScript's `Map` (and `Set`: `V == Void`): a shared hash map (O(1) get / set / has / delete) in insertion order.
/// A delete leaves a hole until the slots are compacted. Each slot keeps the sequence number it was added with, so
/// iteration (`next(s)`: the entry after sequence `s`) is live as in JavaScript: an entry deleted before its turn is
/// skipped, one added during the loop is visited, and compaction or `clear()` under a running loop loses nothing.
public final class JsOMap<KK: JsKeyKind, V> {
    @exclusivity(unchecked) @usableFromInline var index: [KK.H: Int] = [:]
    @exclusivity(unchecked) @usableFromInline var slots: [(key: KK.K, value: V)?] = []
    @exclusivity(unchecked) @usableFromInline var seqs: [Int] = []
    @usableFromInline var nextSeq = 0
    /// The slot of the sequence number `next` returned last.
    @usableFromInline var cur = 0

    public init() {}

    @inlinable public func size() -> Int { index.count }
    @inlinable public func get(_ k: KK.K) -> V? { index[KK.h(k)].map { slots[$0]!.value } }
    @inlinable public func has(_ k: KK.K) -> Bool { index[KK.h(k)] != nil }
    @discardableResult public func set(_ k: KK.K, _ v: V) -> JsOMap {
        let h = KK.h(k)
        if let i = index[h] { slots[i]!.value = v; return self }
        index[h] = slots.count
        // -0 is stored as +0.
        slots.append((key: KK.norm(k), value: v))
        seqs.append(nextSeq)
        nextSeq += 1
        return self
    }
    @discardableResult public func delete(_ k: KK.K) -> Bool {
        guard let i = index.removeValue(forKey: KK.h(k)) else { return false }
        let old = slots[i]
        slots[i] = nil
        _ = old  // released after the slot is cleared
        // Mostly holes: compact, so the slots stay proportional to the entries.
        if slots.count > 16 && index.count * 2 < slots.count {
            var j = 0
            for i in slots.indices where slots[i] != nil {
                slots[j] = slots[i]
                seqs[j] = seqs[i]
                index[KK.h(slots[j]!.key)] = j
                j += 1
            }
            slots.removeLast(slots.count - j)
            seqs.removeLast(seqs.count - j)
            cur = 0
        }
        return true
    }
    public func clear() {
        let old = slots
        index.removeAll()
        slots.removeAll()
        seqs.removeAll()
        cur = 0
        _ = old
    }

    /// The slot holding sequence number `s` (or the first after it).
    @usableFromInline func slot(after s: Int) -> Int {
        var lo = 0, hi = seqs.count
        while lo < hi { let mid = (lo + hi) / 2; if seqs[mid] <= s { lo = mid + 1 } else { hi = mid } }
        return lo
    }
    @usableFromInline func slot(of s: Int) -> Int { cur < seqs.count && seqs[cur] == s ? cur : slot(after: s - 1) }
    /// The sequence number of the first live entry after `s` (-1: from the start), or -1 at the end.
    public func next(_ s: Int) -> Int {
        var p = s < 0 ? 0 : cur < seqs.count && seqs[cur] == s ? cur + 1 : slot(after: s)
        while p < slots.count && slots[p] == nil { p += 1 }
        if p >= slots.count { return -1 }
        cur = p
        return seqs[p]
    }
    @inlinable public func keyAt(_ s: Int) -> KK.K { slots[slot(of: s)]!.key }
    @inlinable public func valueAt(_ s: Int) -> V { slots[slot(of: s)]!.value }

    public func forEach(_ f: (V, KK.K) throws -> Void) rethrows {
        var s = -1
        while true {
            s = next(s)
            if s < 0 { return }
            let e = slots[cur]!
            try f(e.value, e.key)
        }
    }
    public func keysArr() -> JsArray<KK.K> { JsArray(slots.compactMap { $0?.key }) }
    public func valuesArr() -> JsArray<V> { JsArray(slots.compactMap { $0?.value }) }
    public func pairs<T>(_ f: (KK.K, V) throws -> T) rethrows -> JsArray<T> { let s = slots; return JsArray(try s.compactMap { e in try e.map { try f($0.key, $0.value) } }) }
    public func copy() -> JsOMap { let m = JsOMap(); for case let e? in slots { m.set(e.key, e.value) }; return m }
    @discardableResult public func setAll(_ ks: JsArray<KK.K>, _ vs: JsArray<V>) -> JsOMap {
        for (k, v) in zip(ks.a, vs.a) { set(k, v) }
        return self
    }
}

public extension JsOMap where V == Void {
    @discardableResult func add(_ k: KK.K) -> JsOMap { set(k, ()) }
    @discardableResult func addAll(_ ks: JsArray<KK.K>) -> JsOMap { for k in ks.a { set(k, ()) }; return self }
    func forEachSet(_ f: (KK.K, KK.K) throws -> Void) rethrows { try forEach { _, k in try f(k, k) } }
}

// MARK: - Weak references (lib4)

/// The targets `new WeakRef(x)` / `deref()` gave during the current job: kept alive until its microtasks have run, as
/// JavaScript keeps them (ClearKeptObjects), so `new WeakRef(new C()).deref()` is the object on every target.
@MainActor enum JsKept { static var objects: [AnyObject] = [] }
@MainActor func jsKeep(_ o: AnyObject) {
    JsKept.objects.append(o)
    jsScheduleDrain()
}

/// `WeakMap<K, V>` (a `WeakSet` has `V == Void`): entries by the key's identity, the key held weakly (a dead key's entry
/// is dropped by the next sweep, which runs as the map grows), not iterable. A value is held as long as its entry.
public final class JsWeakMap<K, V> {
    struct Entry { weak var key: AnyObject?; var value: V }
    var slots: [ObjectIdentifier: Entry] = [:]
    var sweepAt = 16
    public init() {}
    public func get(_ k: K) -> V? {
        let o = k as AnyObject
        guard let e = slots[ObjectIdentifier(o)], e.key === o else { return nil }
        return e.value
    }
    public func has(_ k: K) -> Bool { let o = k as AnyObject; return slots[ObjectIdentifier(o)]?.key === o }
    @discardableResult public func set(_ k: K, _ v: V) -> JsWeakMap {
        let o = k as AnyObject
        // A dead key's entry under a reused identity is replaced.
        let old = slots.updateValue(Entry(key: o, value: v), forKey: ObjectIdentifier(o))
        _ = old
        if slots.count >= sweepAt {
            slots = slots.filter { $0.value.key != nil }
            sweepAt = Swift.max(16, slots.count * 2)
        }
        return self
    }
    @discardableResult public func delete(_ k: K) -> Bool {
        guard has(k) else { return false }
        let old = slots.removeValue(forKey: ObjectIdentifier(k as AnyObject))
        _ = old
        return true
    }
}
public extension JsWeakMap where V == Void {
    @discardableResult func add(_ k: K) -> JsWeakMap { set(k, ()) }
}

/// `WeakRef<T>`: its target while something else holds it (and until the job that made or read it ends).
@MainActor public final class JsWeakRef<T> {
    weak var target: AnyObject?
    public init(_ t: T) {
        let o = t as AnyObject
        target = o
        jsKeep(o)
    }
    public func deref() -> T? {
        guard let o = target else { return nil }
        jsKeep(o)
        return (o as! T)
    }
}

// MARK: - Cycle collector

/// The Swift runtime's strong reference count of an object (exported by libswiftCore). Read only through a raw
/// pointer, so reading it adds no reference.
@_silgen_name("swift_retainCount") func jsGcRetainCount(_ object: UnsafeMutableRawPointer) -> Int

/// Where a tracked object is in the registry (-1: not tracked). Not actor-isolated: `deinit` updates the registry.
public protocol JsGcSlot: AnyObject { var gcIndex: Int { get set } }

/// An object of a class the compiler found may be part of a reference cycle (cycles.ts): it reports the tracked
/// objects it holds (`gcTraverse`, each reference once, as the reference counts count them) and can drop them (`gcClear`).
@MainActor public protocol JsGcNode: JsGcSlot {
    func gcTraverse(_ s: JsGcScan)
    func gcClear()
}

struct JsGcEntry { unowned(unsafe) let o: JsGcNode }

/// The registry of live tracked objects (no strong reference: an object leaves it in `deinit`) and the collector's
/// settings. Generational: `live[0..<oldEnd]` survived a collection (the old generation), the rest is young.
/// A young collection examines only the young objects (references from old ones count as outside references); the
/// old generation is collected by an incremental pass (`JsGcPass`) spread over many short slices.
public enum JsGc {
    @exclusivity(unchecked) nonisolated(unsafe) static var live: [JsGcEntry] = []
    @exclusivity(unchecked) nonisolated(unsafe) static var oldEnd = 0
    /// While the incremental pass scans and marks, a store into a tracked field reports the value it overwrites.
    @exclusivity(unchecked) nonisolated(unsafe) public static var marking = false
    nonisolated(unsafe) static var pass: JsGcPass?
    nonisolated(unsafe) static var oldAfterPass = 0
    nonisolated(unsafe) static var idleInstalled = false
    /// Young objects that start a young collection at the next safe point (Int.max: none, as a benchmark sets it).
    nonisolated(unsafe) public static var threshold = 4_000
    /// The most objects one indivisible step examines: a bigger young generation is promoted unexamined (the pass
    /// collects it), and the pass verifies its candidates in groups of about this many.
    nonisolated(unsafe) public static var stepMax = 16_000
    /// How long one slice of the incremental pass may run, in nanoseconds.
    nonisolated(unsafe) public static var sliceNanos: UInt64 = 1_000_000
    nonisolated(unsafe) public static var collections = 0
    /// Incremental passes started, and the objects the finished ones freed.
    nonisolated(unsafe) public static var passes = 0
    nonisolated(unsafe) public static var passFreed = 0
    /// The longest one collector step (young collection and pass slice) kept the main thread, in nanoseconds.
    nonisolated(unsafe) public static var maxPauseNanos: UInt64 = 0
    public static var liveCount: Int { live.count - (pass?.holes ?? 0) }
    public static var passActive: Bool { pass != nil }
}

@inline(__always) func jsGcNow() -> UInt64 { DispatchTime.now().uptimeNanoseconds }

/// A slice's deadline (checked every 64 units of work; `.max`: none).
struct JsGcClock {
    let end: UInt64
    var n = 0
    @inline(__always) mutating func over() -> Bool {
        n &+= 1
        return n & 63 == 0 && end != .max && jsGcNow() >= end
    }
    func overNow() -> Bool { end != .max && jsGcNow() >= end }
}

@MainActor public func jsGcTrack(_ o: JsGcNode) -> Int {
    JsGc.live.append(JsGcEntry(o: o))
    return JsGc.live.count - 1
}

/// From `deinit`. An object the running pass numbered stays as a hole until the pass ends; others leave now.
public func jsGcUntrack(_ i: Int) {
    if i < 0 { return }
    if let p = JsGc.pass, p.tombstone(i) { return }
    jsGcRemove(i)
}

/// Removes entry `i`, keeping both generations contiguous: the old generation's last entry fills an old hole, the
/// registry's last entry fills the young one.
func jsGcRemove(_ i: Int) {
    let last = JsGc.live.count - 1
    var hole = i
    if i < JsGc.oldEnd {
        let lastOld = JsGc.oldEnd - 1
        if i < lastOld {
            JsGc.live[i] = JsGc.live[lastOld]
            JsGc.live[i].o.gcIndex = i
        }
        JsGc.oldEnd = lastOld
        hole = lastOld
    }
    if hole < last {
        JsGc.live[hole] = JsGc.live[last]
        JsGc.live[hole].o.gcIndex = hole
    }
    JsGc.live.removeLast()
}

/// A tracked field's store while the pass marks (emitted in the field's `willSet`): the overwritten object or
/// container may now be held from somewhere the pass already scanned, so it is marked live for this pass.
@MainActor public func jsGcBarrier(_ old: AnyObject?) {
    guard let old, let p = JsGc.pass else { return }
    let s = p.scan
    if let o = old as? JsGcSlot {
        if o.gcIndex >= 0 && o.gcIndex < p.end { s.grey(o.gcIndex) }
    } else if let i = s.containers[ObjectIdentifier(old)] {
        s.grey(Int(i))
    }
}

/// What tracked objects reference. Nodes: the objects (by registry index below `limit` — the pass —, or numbered
/// `-2 - gcIndex` by a subset collection), then the containers (arrays, records, Maps / Sets) reached through them, each
/// once, held by the scan; an edge per reference, kept as runs per node.
public final class JsGcScan {
    let limit: Int
    let objects: Int
    var from: Int32 = 0
    /// Each node's strong count (less the scan's own reference to a container), read at the end of the slice that found it.
    var rc: [Int]
    var head: [Int32]
    var dead: [Bool]
    var pending: [(Int32, UnsafeMutableRawPointer)] = []
    var holds: [AnyObject] = []
    var containers: [ObjectIdentifier: Int32] = [:]
    var eTo: [Int32] = []
    var runStart: [Int32] = []
    var runNext: [Int32] = []
    var runFrom: Int32 = -1
    var inDeg: [Int32] = []
    var marked: [Bool] = []
    var greys: [Int32] = []
    var stack: [Int32] = []
    var cursor = 0

    init(objects: Int, limit: Int) {
        self.objects = objects
        self.limit = limit
        rc = [Int](repeating: 0, count: objects)
        head = [Int32](repeating: -1, count: objects)
        dead = [Bool](repeating: false, count: objects)
    }

    @inline(__always) func edge(_ to: Int32) {
        if from != runFrom {
            runFrom = from
            runNext.append(head[Int(from)])
            head[Int(from)] = Int32(runStart.count)
            runStart.append(Int32(eTo.count))
        }
        eTo.append(to)
    }
    /// A reference to an object of a tracked class.
    @inline(__always) public func node(_ o: JsGcSlot?) {
        guard let o else { return }
        let g = o.gcIndex
        if g < -1 { edge(Int32(-2 - g)) } else if g >= 0 && g < limit { edge(Int32(g)) }
    }
    /// A reference to an object that may be of a tracked class (an interface's).
    public func obj(_ o: AnyObject?) {
        if let o = o as? JsGcSlot { node(o) }
    }
    /// A container: a node of its own (first time: its elements' edges).
    @inline(__always) func enter(_ c: AnyObject) -> Bool {
        let id = ObjectIdentifier(c)
        if let i = containers[id] {
            edge(i)
            return false
        }
        let i = Int32(rc.count)
        rc.append(0)
        head.append(-1)
        containers[id] = i
        holds.append(c)
        pending.append((i, Unmanaged.passUnretained(c).toOpaque()))
        edge(i)
        from = i
        return true
    }
    public func arr<T>(_ a: JsArray<T>?, _ f: (JsGcScan, T) -> Void) {
        guard let a else { return }
        let saved = from
        if enter(a) {
            // Storage another array shares (a copy not yet written) would count its elements twice: own it.
            a.a.reserveCapacity(0)
            for e in a.a { f(self, e) }
        }
        from = saved
    }
    public func map<T>(_ m: JsMap<T>?, _ f: (JsGcScan, T) -> Void) {
        guard let m else { return }
        let saved = from
        if enter(m) { m.gcEach { f(self, $0) } }
        from = saved
    }
    public func omap<KK, V>(_ m: JsOMap<KK, V>?, _ f: (JsGcScan, KK.K, V) -> Void) {
        guard let m else { return }
        let saved = from
        if enter(m) { m.gcEach { f(self, $0, $1) } }
        from = saved
    }

    /// The counts of the nodes found since the last call (nothing of the scan but `holds` references them now).
    @inline(never) func readCounts() {
        for (i, p) in pending { rc[Int(i)] = jsGcRetainCount(p) - (Int(i) >= objects ? 1 : 0) }
        pending.removeAll(keepingCapacity: true)
    }
    @inline(__always) func alive(_ i: Int) -> Bool { i >= objects || !dead[i] }
    @inline(__always) func runEnd(_ r: Int) -> Int { r + 1 < runStart.count ? Int(runStart[r + 1]) : eTo.count }

    /// The references into each node from the nodes still alive (resumable: false when the clock ran out).
    func countIn(_ c: inout JsGcClock) -> Bool {
        if inDeg.isEmpty { inDeg = [Int32](repeating: 0, count: rc.count) }
        while cursor < rc.count {
            let i = cursor
            cursor += 1
            if !alive(i) { continue }
            var r = Int(head[i])
            while r >= 0 {
                for k in Int(runStart[r])..<runEnd(r) { inDeg[Int(eTo[k])] += 1 }
                r = Int(runNext[r])
            }
            if c.over() { return false }
        }
        cursor = 0
        return true
    }
    /// A node to keep (the pass's write barrier): marked now, or once marking starts.
    func grey(_ i: Int) {
        if marked.isEmpty { greys.append(Int32(i)) } else if !marked[i] {
            marked[i] = true
            stack.append(Int32(i))
        }
    }
    /// Marks everything reachable from the nodes with outside references (strong count above the references from
    /// nodes) and from the greyed ones (resumable).
    func mark(_ c: inout JsGcClock) -> Bool {
        if marked.isEmpty && !rc.isEmpty {
            marked = [Bool](repeating: false, count: rc.count)
            for g in greys { grey(Int(g)) }
            greys = []
        }
        while cursor < rc.count {
            let i = cursor
            cursor += 1
            if !marked[i] && alive(i) && rc[i] > Int(inDeg[i]) {
                marked[i] = true
                stack.append(Int32(i))
            }
            if c.over() { return false }
        }
        while let i = stack.popLast() {
            var r = Int(head[Int(i)])
            while r >= 0 {
                for k in Int(runStart[r])..<runEnd(r) {
                    let t = Int(eTo[k])
                    if !marked[t] && alive(t) {
                        marked[t] = true
                        stack.append(Int32(t))
                    }
                }
                r = Int(runNext[r])
            }
            if c.over() { return false }
        }
        cursor = 0
        return true
    }
}

extension JsMap {
    func gcEach(_ f: (Value) -> Void) {
        entries.reserveCapacity(0)
        for case let e? in entries { f(e.value) }
    }
}

extension JsOMap {
    func gcEach(_ f: (KK.K, V) -> Void) {
        slots.reserveCapacity(0)
        for case let e? in slots { f(e.key, e.value) }
    }
}

@MainActor @inline(never) func jsGcScanSubset(_ s: JsGcScan, _ members: [Int]) {
    for (k, i) in members.enumerated() { JsGc.live[i].o.gcIndex = -2 - k }
    for (k, i) in members.enumerated() {
        let o = JsGc.live[i].o
        s.pending.append((Int32(k), Unmanaged.passUnretained(o as AnyObject).toOpaque()))
        s.from = Int32(k)
        o.gcTraverse(s)
    }
}

/// Collects the tracked objects at registry indices `members`, in one indivisible step (CPython's algorithm): an
/// object's strong count minus the references from the members (and the containers they reach) is what the rest of
/// the program holds, including every object outside the set; what is reachable from an object with such outside
/// references is live; the rest is garbage, its references are dropped, and ARC frees it. Nothing of the app runs
/// meanwhile, so this is exact for the set whatever happened before. Returns how many objects it freed.
@MainActor func jsGcCollectSubset(_ members: [Int]) -> Int {
    let n = members.count
    if n == 0 { return 0 }
    JsGc.collections += 1
    let marking = JsGc.marking
    JsGc.marking = false
    var s: JsGcScan? = JsGcScan(objects: n, limit: 0)
    jsGcScanSubset(s!, members)
    s!.readCounts()
    var c = JsGcClock(end: .max)
    _ = s!.countIn(&c)
    _ = s!.mark(&c)
    // The members' registry indices back (a freed object leaves the registry by it), then the garbage.
    for i in members { JsGc.live[i].o.gcIndex = i }
    // Garbage: held while every one drops its references (none is freed under a gcClear), then released.
    var garbage: [JsGcNode] = []
    for k in 0..<n where !s!.marked[k] { garbage.append(JsGc.live[members[k]].o) }
    s = nil
    for g in garbage { g.gcClear() }
    let freed = garbage.count
    garbage.removeAll()
    JsGc.marking = marking
    return freed
}

/// The incremental collection of the old generation (the objects at registry indices `0..<end` when it started),
/// in phases, each resumable at a slice's deadline: scan (each object's references and strong count), count,
/// mark (from the objects with outside references, and from every object a tracked field's store overwrote while it
/// ran: the write barrier), group the unmarked objects into connected candidate groups, verify each group with an
/// indivisible subset collection (which alone decides what is freed), then compact the registry.
/// Soundness does not depend on the slices seeing a consistent graph: a candidate is freed only by a verification,
/// which is exact for its group at that instant. The barrier only keeps moved objects out of the candidates.
/// Objects of the pass that die meanwhile stay in the registry as holes (`dead`) so the numbering holds.
final class JsGcPass {
    let end: Int
    let scan: JsGcScan
    var phase = 0
    var cursor = 0
    var holes = 0
    var parent: [Int32] = []
    var memberHead: [Int32] = []
    var memberNext: [Int32] = []
    var groups: [Int32] = []
    var freed = 0

    init(end: Int) {
        self.end = end
        scan = JsGcScan(objects: end, limit: end)
    }

    /// An object of the pass died: true when its entry stays as a hole (compaction already passed it: it leaves now).
    func tombstone(_ i: Int) -> Bool {
        if i >= end || (phase == 6 && i >= cursor) { return false }
        scan.dead[i] = true
        holes += 1
        return true
    }

    func find(_ x: Int) -> Int {
        var x = x
        while Int(parent[x]) != x {
            parent[x] = parent[Int(parent[x])]
            x = Int(parent[x])
        }
        return x
    }

    /// Runs until the clock's deadline; true once the pass is over.
    @MainActor func step(_ c: inout JsGcClock) -> Bool {
        let s = scan
        while true {
            switch phase {
            case 0:
                jsGcScanSlice(self, &c)
                s.readCounts()
                if cursor < end { return false }
                // Every count is read: the containers need not stay.
                s.holds = []
                cursor = 0
                phase = 1
            case 1:
                if !s.countIn(&c) { return false }
                phase = 2
            case 2:
                if !s.mark(&c) { return false }
                JsGc.marking = false
                s.inDeg = []
                parent = (0..<Int32(s.rc.count)).map { $0 }
                phase = 3
            case 3:
                while cursor < s.rc.count {
                    let i = cursor
                    cursor += 1
                    if s.marked[i] || !s.alive(i) { continue }
                    var r = Int(s.head[i])
                    while r >= 0 {
                        for k in Int(s.runStart[r])..<s.runEnd(r) {
                            let t = Int(s.eTo[k])
                            if !s.marked[t] && s.alive(t) {
                                let a = find(i), b = find(t)
                                if a != b { parent[max(a, b)] = Int32(min(a, b)) }
                            }
                        }
                        r = Int(s.runNext[r])
                    }
                    if c.over() { return false }
                }
                cursor = 0
                memberHead = [Int32](repeating: -1, count: s.rc.count)
                memberNext = [Int32](repeating: -1, count: end)
                phase = 4
            case 4:
                while cursor < end {
                    let i = cursor
                    cursor += 1
                    if s.marked[i] || s.dead[i] { continue }
                    let r = find(i)
                    if memberHead[r] < 0 { groups.append(Int32(r)) }
                    memberNext[i] = memberHead[r]
                    memberHead[r] = Int32(i)
                    if c.over() { return false }
                }
                cursor = 0
                s.eTo = []
                s.runStart = []
                s.runNext = []
                parent = []
                phase = 5
            case 5:
                while cursor < groups.count {
                    var members: [Int] = []
                    while cursor < groups.count && members.count < JsGc.stepMax {
                        var m = Int(memberHead[Int(groups[cursor])])
                        cursor += 1
                        while m >= 0 {
                            if !s.dead[m] { members.append(m) }
                            m = Int(memberNext[m])
                        }
                    }
                    freed += jsGcCollectSubset(members)
                    if c.overNow() { return false }
                }
                memberHead = []
                memberNext = []
                groups = []
                s.rc = []
                s.head = []
                s.marked = []
                cursor = end
                phase = 6
            default:
                // Compaction, from the top: an entry above the cursor that dies now leaves at once (tombstone).
                while cursor > 0 {
                    cursor -= 1
                    if s.dead[cursor] {
                        holes -= 1
                        jsGcRemove(cursor)
                    }
                    if c.over() { return false }
                }
                JsGc.pass = nil
                JsGc.oldAfterPass = JsGc.oldEnd
                JsGc.passFreed += freed
                return true
            }
        }
    }
}

@MainActor @inline(never) func jsGcScanSlice(_ p: JsGcPass, _ c: inout JsGcClock) {
    let s = p.scan
    while p.cursor < p.end {
        let i = p.cursor
        p.cursor += 1
        if s.dead[i] { continue }
        let o = JsGc.live[i].o
        s.pending.append((Int32(i), Unmanaged.passUnretained(o as AnyObject).toOpaque()))
        s.from = Int32(i)
        o.gcTraverse(s)
        if c.over() { return }
    }
}

/// Ends a running pass at once (its candidates are dropped; the registry is compacted).
@MainActor func jsGcAbortPass() {
    guard let p = JsGc.pass else { return }
    JsGc.marking = false
    if p.phase != 6 {
        p.phase = 6
        p.cursor = p.end
    }
    var c = JsGcClock(end: .max)
    _ = p.step(&c)
}

/// A young collection: the objects made since the last one, alone (old objects' references count as outside
/// references), then they all become old. More than `stepMax` young objects (a long synchronous burst) are promoted
/// unexamined: the incremental pass collects them.
@MainActor func jsGcYoung() {
    let lo = JsGc.oldEnd, n = JsGc.live.count - lo
    if n > 0 && n <= JsGc.stepMax { _ = jsGcCollectSubset(Array(lo..<JsGc.live.count)) }
    JsGc.oldEnd = JsGc.live.count
}

/// Starts an incremental pass over the old generation now (the young objects first become old), unless one runs.
@MainActor public func jsGcStartPass() {
    if JsGc.pass != nil { return }
    JsGc.oldEnd = JsGc.live.count
    JsGc.pass = JsGcPass(end: JsGc.oldEnd)
    JsGc.passes += 1
    JsGc.marking = true
}

/// Frees every tracked object only tracked garbage reaches, now, in one step over the whole registry (tests, memory
/// warnings). A running pass is ended first. Returns how many objects it freed.
@MainActor @discardableResult public func jsGcCollect() -> Int {
    jsGcAbortPass()
    let freed = jsGcCollectSubset(Array(0..<JsGc.live.count))
    JsGc.oldEnd = JsGc.live.count
    JsGc.oldAfterPass = JsGc.oldEnd
    return freed
}

/// One collector step at a safe point (no app code on the stack): a young collection once `threshold` young objects
/// exist; a pass once the old generation doubled since the last (at least 10 000 more); then a slice of the running
/// pass, up to `sliceNanos`. While a pass runs, the main run loop's idle time (before it waits) runs more slices.
@MainActor public func jsGcStep() {
    let t0 = jsGcNow()
    if JsGc.live.count - JsGc.oldEnd >= JsGc.threshold { jsGcYoung() }
    if JsGc.pass == nil && JsGc.oldEnd - JsGc.oldAfterPass >= max(10_000, JsGc.oldAfterPass) { jsGcStartPass() }
    if let p = JsGc.pass {
        var c = JsGcClock(end: t0 + JsGc.sliceNanos)
        _ = p.step(&c)
    }
    let t = jsGcNow() - t0
    if t > JsGc.maxPauseNanos { JsGc.maxPauseNanos = t }
    if JsGc.pass != nil { jsGcScheduleIdle() }
}

/// More slices while the main run loop is idle: an observer before it waits runs one and wakes it again.
@MainActor func jsGcScheduleIdle() {
    if !JsGc.idleInstalled {
        JsGc.idleInstalled = true
        let observer = CFRunLoopObserverCreateWithHandler(nil, CFRunLoopActivity.beforeWaiting.rawValue, true, 0) { _, _ in
            MainActor.assumeIsolated { if JsGc.pass != nil { jsGcStep() } }
        }
        CFRunLoopAddObserver(CFRunLoopGetMain(), observer, .commonModes)
    }
    CFRunLoopWakeUp(CFRunLoopGetMain())
}

/// At a safe point (a microtask drain's end).
@MainActor @inline(__always) func jsGcMaybe() {
    if JsGc.pass != nil || JsGc.live.count - JsGc.oldEnd >= JsGc.threshold { jsGcStep() }
}

// MARK: - ArrayBuffer and DataView (lib4)

/// `ArrayBuffer`: the byte store `Uint8Array` / `Uint8ClampedArray` views share (`new Uint8Array(buffer, …)`, `.buffer`).
public typealias ArrayBuffer = JsTAStore<UInt8>

private func jsRange(_ message: String) -> NError { NError(name: "RangeError", message) }
/// ToIndex, with the message of the RangeError for a negative value.
private func jsIndex(_ d: Double, _ negative: String) throws -> Int {
    let t = jsToInteger(d)
    if t < 0 { throw jsRange(negative) }
    if t > 9007199254740991 { throw jsRange("length larger than (2 ** 53) - 1") }
    return Int(t)
}
public func jsNewArrayBuffer(_ n: Double) throws -> ArrayBuffer { ArrayBuffer(try jsIndex(n, "length cannot be negative"), 0) }
public func jsAbByteLength(_ b: ArrayBuffer) -> Double { Double(b.count) }
public func jsAbSlice(_ b: ArrayBuffer, _ start: Double, _ end: Double) -> ArrayBuffer {
    let s = jsTARel(start, b.count), e = Swift.max(jsTARel(end, b.count), s)
    let out = ArrayBuffer(e - s, 0)
    if e > s { out.p.update(from: b.p + s, count: e - s) }
    return out
}
/// `new Uint8Array(buffer, byteOffset, length?)` (and Uint8ClampedArray): a view sharing the buffer's bytes.
public func jsUint8View<K: JsTAKind>(_ b: ArrayBuffer, _ off: Double, _ len: Double?) throws -> JsTypedArray<K> where K.S == UInt8 {
    let o = try jsIndex(off, "byteOffset cannot be negative")
    let n = try len.map { try jsIndex($0, "length cannot be negative") }
    guard o <= b.count, o + (n ?? 0) <= b.count else { throw jsRange("Length out of range of buffer") }
    return JsTypedArray<K>(b, o, n ?? b.count - o)
}
public func jsNewUint8Array(_ b: ArrayBuffer, _ off: Double) throws -> Uint8Array { try jsUint8View(b, off, nil) }
public func jsNewUint8ArrayLen(_ b: ArrayBuffer, _ off: Double, _ len: Double) throws -> Uint8Array { try jsUint8View(b, off, len) }
public func jsNewUint8ClampedArray(_ b: ArrayBuffer, _ off: Double) throws -> Uint8ClampedArray { try jsUint8View(b, off, nil) }
public func jsNewUint8ClampedArrayLen(_ b: ArrayBuffer, _ off: Double, _ len: Double) throws -> Uint8ClampedArray { try jsUint8View(b, off, len) }
public func jsTaBuffer<K: JsTAKind>(_ t: JsTypedArray<K>) -> ArrayBuffer where K.S == UInt8 { t.store }

/// `DataView`: reads and writes numbers of any size and byte order in a window of an ArrayBuffer.
public final class DataView {
    public let buffer: ArrayBuffer
    public let byteOffset: Int
    public let byteLength: Int
    init(_ b: ArrayBuffer, _ o: Int, _ n: Int) { buffer = b; byteOffset = o; byteLength = n }
}
public func jsNewDataViewLen(_ b: ArrayBuffer, _ off: Double, _ len: Double) throws -> DataView { try jsNewDataView(b, off, len) }
public func jsNewDataView(_ b: ArrayBuffer, _ off: Double, _ len: Double? = nil) throws -> DataView {
    let o = try jsIndex(off, "byteOffset cannot be negative")
    if o > b.count { throw jsRange("byteOffset exceeds source ArrayBuffer byteLength") }
    guard let len else { return DataView(b, o, b.count - o) }
    let n = try jsIndex(len, "byteLength cannot be negative")
    if o + n > b.count { throw jsRange("Length out of range of buffer") }
    return DataView(b, o, n)
}
public func jsDvBuffer(_ d: DataView) -> ArrayBuffer { d.buffer }
public func jsDvByteLength(_ d: DataView) -> Double { Double(d.byteLength) }
public func jsDvByteOffset(_ d: DataView) -> Double { Double(d.byteOffset) }
/// The bytes [at, at + size) of the view as an unsigned integer in the given byte order.
private func jsDvLoad(_ d: DataView, _ at: Double, _ size: Int, _ little: Bool) throws -> UInt64 {
    let i = try jsIndex(at, "byteOffset cannot be negative")
    if i + size > d.byteLength { throw jsRange("Out of bounds access") }
    let p = d.buffer.p + d.byteOffset + i
    var v: UInt64 = 0
    for k in 0..<size { v |= UInt64(p[little ? k : size - 1 - k]) << (8 * UInt64(k)) }
    return v
}
private func jsDvStore(_ d: DataView, _ at: Double, _ size: Int, _ little: Bool, _ v: UInt64) throws {
    let i = try jsIndex(at, "byteOffset cannot be negative")
    if i + size > d.byteLength { throw jsRange("Out of bounds access") }
    let p = d.buffer.p + d.byteOffset + i
    for k in 0..<size { p[little ? k : size - 1 - k] = UInt8(truncatingIfNeeded: v >> (8 * UInt64(k))) }
}
private let jsDvSizes = [1, 1, 2, 2, 4, 4, 4, 8]
/// `getInt8` … `getFloat64` (kind 0 Int8, 1 Uint8, 2 Int16, 3 Uint16, 4 Int32, 5 Uint32, 6 Float32, 7 Float64).
public func jsDvGet(_ d: DataView, _ kind: Int, _ at: Double, _ little: Bool) throws -> Double {
    let v = try jsDvLoad(d, at, jsDvSizes[kind], little)
    switch kind {
    case 0: return Double(Int8(truncatingIfNeeded: v))
    case 2: return Double(Int16(truncatingIfNeeded: v))
    case 4: return Double(Int32(truncatingIfNeeded: v))
    case 6: return Double(Float(bitPattern: UInt32(v)))
    case 7: return Double(bitPattern: v)
    default: return Double(v)
    }
}
/// `setInt8` … `setFloat64`: the number converted as a typed array of that kind converts it (NaN stored canonical).
public func jsDvSet(_ d: DataView, _ kind: Int, _ at: Double, _ x: Double, _ little: Bool) throws {
    let v: UInt64
    switch kind {
    case 6: v = x.isNaN ? 0x7fc0_0000 : UInt64(Float(x).bitPattern)
    case 7: v = x.isNaN ? 0x7ff8_0000_0000_0000 : x.bitPattern
    default: v = UInt64(UInt32(bitPattern: jsI32(x)))
    }
    try jsDvStore(d, at, jsDvSizes[kind], little, v)
}
public func jsDvGetBig(_ d: DataView, _ signed: Bool, _ at: Double, _ little: Bool) throws -> JsBigInt {
    let v = try jsDvLoad(d, at, 8, little)
    return signed ? JsBigInt(Int(Int64(bitPattern: v))) : JsBigInt.asUintN(64, JsBigInt(Int(Int64(bitPattern: v))))
}
public func jsDvSetBig(_ d: DataView, _ signed: Bool, _ at: Double, _ x: JsBigInt, _ little: Bool) throws {
    let v = JsBigInt.asIntN(64, x)
    try jsDvStore(d, at, 8, little, UInt64(bitPattern: Int64(v.description)!))
}
