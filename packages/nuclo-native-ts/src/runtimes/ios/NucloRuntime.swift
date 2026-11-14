// NucloRuntime.swift — the iOS runtime for apps compiled by nuclo-native-ts. UIKit only, no dependencies.
//
// The model is nuclo's: builders create native views once; `update()` re-runs the dynamic values
// (each dirty-checked against its last value before a view is touched) and reconciles list(),
// when() and region() in place. There is no virtual DOM and no JavaScript.
//
//   Node        one view (or a fragment: list/when/region/into, which owns no view)
//   FlexView    the container view: a flex column or row laid out by `Flex` below
//   Runtime     roots, update(), regions, the window
//   NRouter     tabs and navigation stacks on UITabBarController + UINavigationController
//
// Requires iOS 15 (URLSession async, UIAction). Swift 5.9+.

import UIKit

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

public struct NError: Error, LocalizedError {
    public let message: String
    public init(_ message: String) { self.message = message }
    public var errorDescription: String? { message }
}

// MARK: - Style

public enum FlexDirection: Equatable { case row, column }
public enum Align: Equatable { case flexStart, center, flexEnd, stretch }
public enum Justify: Equatable { case flexStart, center, flexEnd, spaceBetween }
public enum Position: Equatable { case relative, absolute }
public enum Display: Equatable { case flex, none }
public enum FontWeight: Equatable { case normal, bold }
public enum TextAlign: Equatable { case left, center, right }

/// The style subset every runtime lays out the same way. Parameters follow the TypeScript `Style` order.
public struct Style: Equatable {
    public var flexDirection: FlexDirection?
    public var alignItems: Align?
    public var justifyContent: Justify?
    public var flex: Double?
    public var gap: Double?
    public var padding: Double?
    public var paddingTop: Double?
    public var paddingRight: Double?
    public var paddingBottom: Double?
    public var paddingLeft: Double?
    public var width: Double?
    public var height: Double?
    public var minHeight: Double?
    public var position: Position?
    public var top: Double?
    public var right: Double?
    public var bottom: Double?
    public var left: Double?
    public var display: Display?
    public var backgroundColor: String?
    public var color: String?
    public var opacity: Double?
    public var borderRadius: Double?
    public var borderWidth: Double?
    public var borderColor: String?
    public var fontSize: Double?
    public var fontWeight: FontWeight?
    public var textAlign: TextAlign?

    public init(
        flexDirection: FlexDirection? = nil, alignItems: Align? = nil, justifyContent: Justify? = nil, flex: Double? = nil,
        gap: Double? = nil, padding: Double? = nil, paddingTop: Double? = nil, paddingRight: Double? = nil,
        paddingBottom: Double? = nil, paddingLeft: Double? = nil, width: Double? = nil, height: Double? = nil,
        minHeight: Double? = nil, position: Position? = nil, top: Double? = nil, right: Double? = nil, bottom: Double? = nil,
        left: Double? = nil, display: Display? = nil, backgroundColor: String? = nil, color: String? = nil,
        opacity: Double? = nil, borderRadius: Double? = nil, borderWidth: Double? = nil, borderColor: String? = nil,
        fontSize: Double? = nil, fontWeight: FontWeight? = nil, textAlign: TextAlign? = nil
    ) {
        self.flexDirection = flexDirection; self.alignItems = alignItems; self.justifyContent = justifyContent
        self.flex = flex; self.gap = gap; self.padding = padding; self.paddingTop = paddingTop
        self.paddingRight = paddingRight; self.paddingBottom = paddingBottom; self.paddingLeft = paddingLeft
        self.width = width; self.height = height; self.minHeight = minHeight; self.position = position
        self.top = top; self.right = right; self.bottom = bottom; self.left = left; self.display = display
        self.backgroundColor = backgroundColor; self.color = color; self.opacity = opacity
        self.borderRadius = borderRadius; self.borderWidth = borderWidth; self.borderColor = borderColor
        self.fontSize = fontSize; self.fontWeight = fontWeight; self.textAlign = textAlign
    }

    /// `other`'s set values win, as later declarations do in CSS.
    public func merged(_ o: Style) -> Style {
        var s = self
        s.flexDirection = o.flexDirection ?? s.flexDirection; s.alignItems = o.alignItems ?? s.alignItems
        s.justifyContent = o.justifyContent ?? s.justifyContent; s.flex = o.flex ?? s.flex; s.gap = o.gap ?? s.gap
        // A `padding` shorthand resets the sides set before it.
        if let p = o.padding { s.padding = p; s.paddingTop = nil; s.paddingRight = nil; s.paddingBottom = nil; s.paddingLeft = nil }
        s.paddingTop = o.paddingTop ?? s.paddingTop; s.paddingRight = o.paddingRight ?? s.paddingRight
        s.paddingBottom = o.paddingBottom ?? s.paddingBottom; s.paddingLeft = o.paddingLeft ?? s.paddingLeft
        s.width = o.width ?? s.width; s.height = o.height ?? s.height; s.minHeight = o.minHeight ?? s.minHeight
        s.position = o.position ?? s.position; s.top = o.top ?? s.top; s.right = o.right ?? s.right
        s.bottom = o.bottom ?? s.bottom; s.left = o.left ?? s.left; s.display = o.display ?? s.display
        s.backgroundColor = o.backgroundColor ?? s.backgroundColor; s.color = o.color ?? s.color
        s.opacity = o.opacity ?? s.opacity; s.borderRadius = o.borderRadius ?? s.borderRadius
        s.borderWidth = o.borderWidth ?? s.borderWidth; s.borderColor = o.borderColor ?? s.borderColor
        s.fontSize = o.fontSize ?? s.fontSize; s.fontWeight = o.fontWeight ?? s.fontWeight; s.textAlign = o.textAlign ?? s.textAlign
        return s
    }

    /// The properties a child takes from its parent unless it sets them.
    var inherited: Style { Style(color: color, fontSize: fontSize, fontWeight: fontWeight, textAlign: textAlign) }

    var insets: UIEdgeInsets {
        let b = CGFloat(borderWidth ?? 0)
        return UIEdgeInsets(
            top: CGFloat(paddingTop ?? padding ?? 0) + b, left: CGFloat(paddingLeft ?? padding ?? 0) + b,
            bottom: CGFloat(paddingBottom ?? padding ?? 0) + b, right: CGFloat(paddingRight ?? padding ?? 0) + b
        )
    }
}

public struct StyleClass: NodeMod {
    let style: Style
    public func apply(to node: Node) { node.classes.append(style) }
}

public func css(_ style: Style) -> StyleClass { StyleClass(style: style) }

public func cx(_ classes: StyleClass?...) -> StyleClass {
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

func color(_ value: String?) -> UIColor? {
    guard var hex = value?.trimmingCharacters(in: .whitespaces).lowercased() else { return nil }
    switch hex {
    case "transparent": return .clear
    case "white": return .white
    case "black": return .black
    case "red": return .systemRed
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

/// What the browser (and nuclo-native) give each tag before any style.
private func tagStyle(_ tag: String) -> Style {
    switch tag {
    case "h1": return Style(fontSize: 32, fontWeight: .bold)
    case "h2": return Style(fontSize: 22, fontWeight: .bold)
    case "h3": return Style(fontSize: 19, fontWeight: .bold)
    case "h4": return Style(fontSize: 17, fontWeight: .bold)
    case "strong": return Style(fontWeight: .bold)
    case "small": return Style(fontSize: 12)
    case "button": return Style(paddingTop: 8, paddingRight: 14, paddingBottom: 8, paddingLeft: 14, color: "#2563eb")
    case "input", "textarea": return Style(padding: 8)
    default: return Style()
    }
}

// MARK: - Node

@MainActor public final class Node: NodeMod {
    enum Kind { case box, text, button, input, checkbox, textarea, image, fragment }

    let kind: Kind
    let tag: String
    let view: UIView?
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
    private(set) var destroyed = false

    var textParts: [@MainActor () -> String] = []
    private var lastText: String?

    var classes: [Style] = []
    var dynamicClass: (@MainActor () -> StyleClass)?
    var inline = Style()
    var dynamicInline: (@MainActor () -> Style)?
    private(set) var computed = Style()
    private var painted: Style?

    var onEvent: [String: @MainActor (NativeEvent) -> Void] = [:]

    init(_ kind: Kind, tag: String) {
        self.kind = kind
        self.tag = tag
        switch kind {
        case .box: view = FlexView()
        case .text: view = PaddedLabel()
        case .button: view = NButton()
        case .input: view = PaddedTextField()
        case .checkbox: view = UISwitch()
        case .textarea: view = UITextView()
        case .image: view = UIImageView()
        case .fragment: view = nil
        }
        (view as? FlexView)?.node = self
        if let image = view as? UIImageView {
            image.contentMode = .scaleAspectFill
            image.clipsToBounds = true
        }
        if let textView = view as? UITextView {
            textView.isScrollEnabled = false
            textView.backgroundColor = .clear
        }
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

    /// The nearest node with a view: where this node's views are inserted.
    var host: Node? {
        var n = parent
        while let current = n, current.view == nil { n = current.parent }
        return n
    }

    /// This node's views in order: its own, or a fragment's children's.
    var flatViews: [Node] { view != nil ? [self] : children.flatMap(\.flatViews) }

    /// Puts the child views where the node tree says they are.
    func syncViews() {
        if let flex = view as? FlexView { flex.setItems(children.flatMap(\.flatViews)) } else { host?.syncViews() }
    }

    // MARK: Bindings

    /// Runs `get` now and on each update; `set` only sees values that changed.
    func bind<T: Equatable>(_ get: @escaping @MainActor () -> T, _ set: @escaping @MainActor (T) -> Void) {
        var last: T?
        let run: @MainActor () -> Void = {
            let value = get()
            if value != last {
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
        default:
            let child = Node(.text, tag: "span")
            child.addText(part)
            append(child)
        }
    }

    private func renderText() {
        let text = textParts.map { $0() }.joined()
        guard text != lastText else { return }
        lastText = text
        if let label = view as? UILabel { label.text = text }
        if let button = view as? NButton { button.label.text = text }
        Runtime.shared.needsLayout()
    }

    // MARK: Refresh

    func refresh() {
        guard !destroyed else { return }
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
        computed = s
        guard s != painted else { return }
        painted = s
        paint(view, s)
        Runtime.shared.needsLayout()
    }

    private func paint(_ view: UIView, _ s: Style) {
        view.backgroundColor = color(s.backgroundColor) ?? .clear
        view.alpha = CGFloat(s.opacity ?? 1)
        view.isHidden = s.display == Display.none
        view.layer.cornerRadius = CGFloat(s.borderRadius ?? 0)
        view.layer.borderWidth = CGFloat(s.borderWidth ?? 0)
        view.layer.borderColor = color(s.borderColor)?.cgColor
        if kind == .box || kind == .image { view.clipsToBounds = (s.borderRadius ?? 0) > 0 }
        if kind == .box && s.position == .absolute { view.isUserInteractionEnabled = true }
        let font = UIFont.systemFont(ofSize: CGFloat(s.fontSize ?? 15), weight: s.fontWeight == .bold ? .bold : .regular)
        let textColor = color(s.color) ?? .black
        let alignment: NSTextAlignment = s.textAlign == .center ? .center : s.textAlign == .right ? .right : .natural
        switch view {
        case let label as PaddedLabel:
            label.font = font; label.textColor = textColor; label.textAlignment = alignment; label.insets = s.insets
        case let button as NButton:
            button.label.font = font; button.label.textColor = textColor; button.label.insets = s.insets
            button.label.textAlignment = .center
            button.layer.cornerRadius = CGFloat(s.borderRadius ?? 0)
        case let field as PaddedTextField:
            field.font = font; field.textColor = textColor; field.textAlignment = alignment; field.insets = s.insets
        case let textView as UITextView:
            textView.font = font; textView.textColor = textColor; textView.textContainerInset = s.insets
        default:
            break
        }
    }

    // MARK: Lifecycle

    func watchMount() {
        guard let view, !view.subviews.contains(where: { $0 is MountProbe }) else { return }
        let probe = MountProbe()
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

    func fire(_ type: String) {
        onEvent[type]?(NativeEvent(target: target))
    }

    private func wireEvents() {
        switch view {
        case let button as NButton:
            button.addAction(UIAction { [weak self] _ in self?.fire("click") }, for: .touchUpInside)
        case let field as PaddedTextField:
            field.addAction(UIAction { [weak self] _ in self?.fire("input") }, for: .editingChanged)
            field.addAction(UIAction { [weak self] _ in self?.fire("change") }, for: .editingDidEndOnExit)
        case let toggle as UISwitch:
            toggle.addAction(UIAction { [weak self] _ in self?.fire("change") }, for: .valueChanged)
        case let textView as UITextView:
            let delegate = TextViewDelegate { [weak self] in self?.fire("input") }
            textView.delegate = delegate
            objc_setAssociatedObject(textView, &TextViewDelegate.key, delegate, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        default:
            break
        }
    }

    func listen(_ type: String, _ handler: @escaping @MainActor (NativeEvent) -> Void) {
        onEvent[type] = handler
        if type == "click", let flex = view as? FlexView { flex.enableTap { [weak self] in self?.fire("click") } }
    }

    var target: InputTarget {
        switch view {
        case let field as UITextField: return InputTarget(value: field.text ?? "", checked: false)
        case let textView as UITextView: return InputTarget(value: textView.text ?? "", checked: false)
        case let toggle as UISwitch: return InputTarget(value: toggle.isOn ? "on" : "", checked: toggle.isOn)
        default: return InputTarget(value: "", checked: false)
        }
    }

    // MARK: Measuring

    var inFlow: Bool { computed.position != .absolute && computed.display != Display.none }

    /// The size this node takes when given at most `maxWidth`.
    func measure(maxWidth: CGFloat) -> CGSize {
        let s = computed
        let width = s.width.map { CGFloat($0) }
        let height = s.height.map { CGFloat($0) }
        let available = width ?? maxWidth
        guard let view else { return .zero }
        var size: CGSize
        switch view {
        case let flex as FlexView:
            size = flex.measure(width: available, height: height)
        case is UISwitch:
            size = CGSize(width: 51, height: 31)
        case let field as PaddedTextField:
            let line = (field.font ?? .systemFont(ofSize: 15)).lineHeight.rounded(.up)
            size = CGSize(width: min(available, 180), height: line + field.insets.top + field.insets.bottom + 6)
        case is UIImageView:
            size = CGSize(width: min(available, 120), height: height ?? width ?? 120)
        default:
            size = view.sizeThatFits(CGSize(width: available, height: .greatestFiniteMagnitude))
            size.width = min(size.width.rounded(.up), available)
            size.height = size.height.rounded(.up)
        }
        if let width { size.width = width }
        if let height { size.height = height }
        if let minHeight = s.minHeight { size.height = max(size.height, CGFloat(minHeight)) }
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
    nonisolated(unsafe) static var key: UInt8 = 0
    let onChange: @MainActor () -> Void
    init(_ onChange: @escaping @MainActor () -> Void) { self.onChange = onChange }
    func textViewDidChange(_ textView: UITextView) { onChange() }
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
        clipsToBounds = true
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        label.frame = bounds
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize { label.sizeThatFits(size) }

    override var isHighlighted: Bool { didSet { label.alpha = isHighlighted ? 0.55 : 1 } }
    override var isEnabled: Bool { didSet { alpha = isEnabled ? 1 : 0.4 } }
}

final class PaddedTextField: UITextField {
    var insets = UIEdgeInsets.zero
    override func textRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func editingRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func placeholderRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
}

/// A container: a flex column (or row) of its node's child views.
final class FlexView: UIView, UIGestureRecognizerDelegate {
    weak var node: Node?
    private(set) var items: [Node] = []
    private var onTap: (@MainActor () -> Void)?

    func setItems(_ next: [Node]) {
        let keep = Set(next.map { ObjectIdentifier($0) })
        for old in items where !keep.contains(ObjectIdentifier(old)) {
            if old.view?.superview === self { old.view?.removeFromSuperview() }
        }
        for (i, item) in next.enumerated() {
            guard let v = item.view else { continue }
            if v.superview !== self || (i < items.count && items[i] !== item) { insertSubview(v, at: i) }
        }
        items = next
        Runtime.shared.needsLayout()
    }

    func enableTap(_ handler: @escaping @MainActor () -> Void) {
        onTap = handler
        guard gestureRecognizers?.isEmpty ?? true else { return }
        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        tap.delegate = self
        addGestureRecognizer(tap)
    }

    @objc private func tapped() { onTap?() }

    /// Controls inside a tappable box keep their own taps.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        var v = touch.view
        while let current = v, current !== self {
            if current is UIControl || current is UITextView { return false }
            v = current.superview
        }
        return true
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        _ = Flex.layout(self, width: bounds.width, height: bounds.height, apply: true)
    }

    func measure(width: CGFloat, height: CGFloat?) -> CGSize {
        Flex.layout(self, width: width, height: height, apply: false)
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize { measure(width: size.width, height: nil) }
}

/// The flex layout both runtimes implement the same way (see NucloRuntime.kt `Flex`).
@MainActor enum Flex {
    /// Lays out `view`'s items in a box `width` wide (and `height` tall when definite); returns the box's size.
    static func layout(_ view: FlexView, width: CGFloat, height: CGFloat?, apply: Bool) -> CGSize {
        let s = view.node?.computed ?? Style()
        let pad = s.insets
        let innerW = max(0, width - pad.left - pad.right)
        let innerH = height.map { max(0, $0 - pad.top - pad.bottom) }
        let gap = CGFloat(s.gap ?? 0)
        let flow = view.items.filter(\.inFlow)
        let gaps = gap * CGFloat(max(0, flow.count - 1))
        let align = s.alignItems ?? .stretch
        let justify = s.justifyContent ?? .flexStart
        let flexes = flow.map { CGFloat($0.computed.flex ?? 0) }
        let totalFlex = flexes.reduce(0, +)
        var frames: [CGRect] = []
        var natural = CGSize.zero

        if s.flexDirection == .row {
            var sizes = flow.enumerated().map { i, child in flexes[i] > 0 ? CGSize.zero : child.measure(maxWidth: innerW) }
            let fixed = sizes.map(\.width).reduce(0, +) + gaps
            let space = max(0, innerW - fixed)
            for i in flow.indices where flexes[i] > 0 {
                let w = space * flexes[i] / totalFlex
                sizes[i] = CGSize(width: w, height: flow[i].measure(maxWidth: w).height)
            }
            let rowH = innerH ?? (sizes.map(\.height).max() ?? 0)
            var x = pad.left
            var spacing = gap
            let free = totalFlex > 0 ? 0 : space
            switch justify {
            case .center: x += free / 2
            case .flexEnd: x += free
            case .spaceBetween: if flow.count > 1 { spacing += free / CGFloat(flow.count - 1) }
            case .flexStart: break
            }
            for (i, child) in flow.enumerated() {
                var size = sizes[i]
                var y = pad.top
                switch align {
                case .stretch: if child.computed.height == nil { size.height = rowH }
                case .center: y += (rowH - size.height) / 2
                case .flexEnd: y += rowH - size.height
                case .flexStart: break
                }
                frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
                x += size.width + spacing
            }
            natural = CGSize(width: (totalFlex > 0 ? innerW : fixed) + pad.left + pad.right, height: rowH + pad.top + pad.bottom)
        } else {
            var sizes = flow.map { child -> CGSize in
                var size = child.measure(maxWidth: innerW)
                if align == .stretch && child.computed.width == nil { size.width = innerW }
                return size
            }
            let content = sizes.map(\.height).reduce(0, +) + gaps
            var free: CGFloat = 0
            if let innerH {
                if totalFlex > 0 {
                    let basis = zip(sizes, flexes).map { $1 > 0 ? 0 : $0.height }.reduce(0, +) + gaps
                    let space = max(0, innerH - basis)
                    for i in flow.indices where flexes[i] > 0 { sizes[i].height = space * flexes[i] / totalFlex }
                } else {
                    free = max(0, innerH - content)
                }
            }
            var y = pad.top
            var spacing = gap
            switch justify {
            case .center: y += free / 2
            case .flexEnd: y += free
            case .spaceBetween: if flow.count > 1 { spacing += free / CGFloat(flow.count - 1) }
            case .flexStart: break
            }
            for (i, _) in flow.enumerated() {
                let size = sizes[i]
                var x = pad.left
                switch align {
                case .center: x += (innerW - size.width) / 2
                case .flexEnd: x += innerW - size.width
                default: break
                }
                frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
                y += size.height + spacing
            }
            let widest = sizes.map(\.width).max() ?? 0
            natural = CGSize(width: widest + pad.left + pad.right, height: (innerH ?? content) + pad.top + pad.bottom)
        }

        if apply {
            for (child, frame) in zip(flow, frames) { child.view?.frame = frame.integral }
            let bounds = CGSize(width: width, height: height ?? natural.height)
            for child in view.items where child.computed.position == .absolute && child.computed.display != Display.none {
                child.view?.frame = absoluteFrame(child, in: bounds).integral
            }
        }
        return CGSize(width: width.isFinite ? min(width, natural.width) : natural.width, height: height ?? natural.height)
    }

    static func absoluteFrame(_ child: Node, in bounds: CGSize) -> CGRect {
        let s = child.computed
        let l = s.left.map { CGFloat($0) }, r = s.right.map { CGFloat($0) }
        let t = s.top.map { CGFloat($0) }, b = s.bottom.map { CGFloat($0) }
        let w = s.width.map { CGFloat($0) } ?? (l != nil && r != nil ? bounds.width - l! - r! : child.measure(maxWidth: bounds.width).width)
        let h = s.height.map { CGFloat($0) } ?? (t != nil && b != nil ? bounds.height - t! - b! : child.measure(maxWidth: w).height)
        let x = l ?? (r != nil ? bounds.width - r! - w : 0)
        let y = t ?? (b != nil ? bounds.height - b! - h : 0)
        return CGRect(x: x, y: y, width: w, height: h)
    }
}

/// A scrolling screen whose content is a node, as tall as its content or the screen.
final class ScreenView: UIScrollView {
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
        guard let v = root.view else { return }
        let visible = bounds.height - adjustedContentInset.top - adjustedContentInset.bottom
        let height = max(root.measure(maxWidth: bounds.width).height, visible)
        v.frame = CGRect(x: 0, y: 0, width: bounds.width, height: height)
        if contentSize != v.frame.size { contentSize = v.frame.size }
    }
}

/// A layer over the app (a later render()): touches go through where it shows nothing.
final class LayerView: UIView {
    let root: Node

    init(_ root: Node) {
        self.root = root
        super.init(frame: .zero)
        if let v = root.view { addSubview(v) }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        root.view?.frame = bounds
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        return hit === self || hit === root.view ? nil : hit
    }
}

final class ScreenController: UIViewController {
    let root: Node

    init(_ root: Node, title: String) {
        self.root = root
        super.init(nibName: nil, bundle: nil)
        self.title = title
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func loadView() { view = ScreenView(root) }
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
    private var roots: [Node] = []
    private var hasMain = false
    private var updating = false
    private var queued: (all: Bool, ids: Set<String>)?
    private var layoutScheduled = false

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
    }

    private func run(_ ids: [String]) {
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

    /// Marks every container for layout on the next pass (cheap: frames are only recomputed once).
    func needsLayout() {
        guard !layoutScheduled else { return }
        layoutScheduled = true
        Task { @MainActor in
            self.layoutScheduled = false
            for node in self.roots { node.view.map(Self.invalidate) }
        }
    }

    private static func invalidate(_ view: UIView) {
        view.setNeedsLayout()
        view.superview?.setNeedsLayout()
        for sub in view.subviews where sub is FlexView { invalidate(sub) }
    }
}

// MARK: - Builders

@MainActor func build(_ kind: Node.Kind, _ tag: String, _ mods: [NodeMod?]) -> Node {
    let node = Node(kind, tag: tag)
    node.add(mods)
    node.syncViews()
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
                if let textView = node.view as? UITextView, textView.text != text { textView.text = text }
                Runtime.shared.needsLayout()
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

    public static func checked(_ value: Bool) -> NodeMod { checked { value } }
    public static func checked(_ value: @escaping @MainActor () -> Bool) -> NodeMod {
        Attr { node in node.bind(value) { on in if let toggle = node.view as? UISwitch, toggle.isOn != on { toggle.setOn(on, animated: true) } } }
    }

    public static func disabled(_ value: Bool) -> NodeMod { disabled { value } }
    public static func disabled(_ value: @escaping @MainActor () -> Bool) -> NodeMod {
        Attr { node in node.bind(value) { (node.view as? UIControl)?.isEnabled = !$0 } }
    }

    public static func inputType(_ type: String) -> NodeMod {
        Attr { node in
            guard let field = node.view as? UITextField else { return }
            field.isSecureTextEntry = type == "password"
            field.keyboardType = type == "email" ? .emailAddress : type == "number" ? .decimalPad : .default
            field.autocapitalizationType = type == "email" ? .none : .sentences
        }
    }

    public static func onClick(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("click", handler) } }
    public static func onInput(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("input", handler) } }
    public static func onChange(_ handler: @escaping @MainActor (NativeEvent) -> Void) -> NodeMod { Attr { $0.listen("change", handler) } }

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

@MainActor public func scope(_ ids: String...) -> NodeMod { Attr { $0.scopes.formUnion(ids) } }

@MainActor public func render(_ view: @escaping @MainActor () -> Node) { Runtime.shared.render(view()) }

@MainActor public func render(_ router: NRouter) { Runtime.shared.render(router) }

// MARK: - list()

/// Rows keyed by identity (classes) as nuclo's list(): a row is rebuilt only when its item is new.
@MainActor public func list<T: AnyObject>(_ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment(items, render, same: { $0 === $1 })
}

/// Rows keyed by value (strings, numbers).
@MainActor public func list<T: Equatable>(_ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?) -> NodeMod {
    listFragment(items, render, same: ==)
}

@MainActor private func listFragment<T>(
    _ items: @escaping @MainActor () -> [T], _ render: @escaping @MainActor (T, Int) -> Node?, same: @escaping (T, T) -> Bool
) -> NodeMod {
    Attr { parent in
        let fragment = Node(.fragment, tag: "list")
        parent.append(fragment)
        var rows: [(item: T, node: Node?)] = []
        fragment.reconcile = { [unowned fragment] in
            let next = items()
            var old = rows
            var built: [(item: T, node: Node?)] = []
            var changed = next.count != rows.count
            for (index, item) in next.enumerated() {
                if let i = old.firstIndex(where: { same($0.item, item) }) {
                    if i != 0 { changed = true }
                    built.append(old.remove(at: i))
                } else {
                    let node = render(item, index)
                    if let node { node.parent = fragment }
                    built.append((item, node))
                    changed = true
                }
            }
            for row in old { row.node?.destroy() }
            rows = built
            if changed {
                fragment.children = built.compactMap { $0.node }
                for row in built { row.node?.applyStylesDeep() }
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

    public init(_ pattern: String, _ view: @escaping @MainActor (Params) -> Node, title: (@MainActor (Params) -> String)? = nil) {
        parts = pattern.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        self.view = view
        self.title = title
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

/// Navigation stacks per tab, shown with UITabBarController and UINavigationController.
/// JS-free nuclo-native semantics: the router owns the stacks; a native back pops first and the router follows.
@MainActor public final class NRouter: NSObject, UINavigationControllerDelegate, UITabBarControllerDelegate {
    struct Entry {
        let path: String
        let node: Node
        let controller: ScreenController
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
        let roots = tabs.isEmpty ? [initial] : tabs.map(\.path)
        active = max(0, tabOf(initial))
        for (i, rootPath) in roots.enumerated() {
            var stack = [entry(rootPath)]
            if i == active && rootPath != initial { stack.append(entry(initial)) }
            let navigation = UINavigationController(rootViewController: stack[0].controller)
            navigation.navigationBar.prefersLargeTitles = true
            navigation.delegate = self
            if stack.count > 1 { navigation.pushViewController(stack[1].controller, animated: false) }
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
        e.controller.navigationItem.largeTitleDisplayMode = .never
        stacks[active].append(e)
        navigations[active].pushViewController(e.controller, animated: true)
        Runtime.shared.update([])
    }

    public func back() {
        guard canGoBack else { return }
        navigations[active].popViewController(animated: true)
    }

    public func reset(_ path: String) {
        let tab = tabOf(path)
        if tab >= 0 {
            active = tab
            tabBar?.selectedIndex = tab
        }
        let navigation = navigations[active]
        if stacks[active][0].path == path {
            navigation.popToRootViewController(animated: true)
        } else {
            let e = entry(path)
            for old in stacks[active] { Runtime.shared.removeRoot(old.node) }
            stacks[active] = [e]
            navigation.setViewControllers([e.controller], animated: false)
        }
        Runtime.shared.update([])
    }

    // The user went back natively (back button, edge swipe): drop the screens no longer shown.
    public func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard let i = navigations.firstIndex(of: navigationController) else { return }
        let shown = navigationController.viewControllers
        let (kept, gone) = stacks[i].reduce(into: ([Entry](), [Entry]())) { acc, e in
            if shown.contains(e.controller) { acc.0.append(e) } else { acc.1.append(e) }
        }
        guard !gone.isEmpty else { return }
        stacks[i] = kept
        for e in gone { Runtime.shared.removeRoot(e.node) }
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
            let controller = ScreenController(node, title: route.title?(params) ?? "")
            return Entry(path: path, node: node, controller: controller)
        }
        let node = p(A.text("No route matches \(path)"))
        Runtime.shared.addRoot(node)
        return Entry(path: path, node: node, controller: ScreenController(node, title: "Not found"))
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
