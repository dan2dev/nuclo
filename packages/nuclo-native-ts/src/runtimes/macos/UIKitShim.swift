// The UIKit names NucloRuntime.swift uses, written on AppKit, so the one iOS runtime also runs on macOS.
// Compiled with the runtime and the generated app only where UIKit does not exist (`macos` target).
//
// A UIView is a flipped, layer-backed NSView, so frames and gestures read as they do on iOS. Pointer
// input is the mouse: taps, pans, long presses and hover come from mouse events (GestureEngine),
// pinch from the trackpad, scrolling from the wheel. Navigation and tabs are plain views drawn like
// the Android / web chrome (a 56 pt bar, a 64 pt tab bar).

#if !canImport(UIKit)
import AppKit
import QuartzCore

// MARK: - Values

public typealias UIColor = NSColor
public typealias UIFont = NSFont
public typealias UIFontDescriptor = NSFontDescriptor
public typealias UIImage = NSImage

public struct UIEdgeInsets: Equatable {
    public var top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat
    public static let zero = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
    public init(top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat) {
        self.top = top; self.left = left; self.bottom = bottom; self.right = right
    }
}

public extension CGRect {
    func inset(by i: UIEdgeInsets) -> CGRect {
        CGRect(x: minX + i.left, y: minY + i.top, width: max(0, width - i.left - i.right), height: max(0, height - i.top - i.bottom))
    }
}

public extension NSFont {
    var lineHeight: CGFloat { ascender - descender + leading }
}

public extension NSImage {
    convenience init?(systemName: String) { self.init(systemSymbolName: systemName, accessibilityDescription: nil) }
}

public struct UIBezierPath {
    public let cgPath: CGPath
    public init(roundedRect rect: CGRect, cornerRadius: CGFloat) {
        let r = max(0, min(cornerRadius, min(rect.width, rect.height) / 2))
        cgPath = CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)
    }
}

@MainActor public final class UIScreen {
    public static let main = UIScreen()
    public var scale: CGFloat { NSScreen.main?.backingScaleFactor ?? 2 }
    public var bounds: CGRect { NSScreen.main?.frame ?? .zero }
}

@MainActor public final class UIApplication {
    public static let shared = UIApplication()
    public func open(_ url: URL) { NSWorkspace.shared.open(url) }
}

public extension NSView.AutoresizingMask {
    static let flexibleWidth = NSView.AutoresizingMask.width
    static let flexibleHeight = NSView.AutoresizingMask.height
}

/// What the runtime asks of a hardware key.
public enum UIKeyboardHIDUsage {
    case keyboardEscape, keyboardTab, keyboardDeleteForward, keyboardLeftArrow, keyboardRightArrow, keyboardUpArrow, keyboardDownArrow
    case keyboardReturnOrEnter, keyboardDeleteOrBackspace, other
}

public final class UIKey {
    public let keyCode: UIKeyboardHIDUsage
    public let characters: String
    init(keyCode: UIKeyboardHIDUsage, characters: String) { self.keyCode = keyCode; self.characters = characters }
}

public final class UIPress: NSObject {
    public let key: UIKey?
    init(key: UIKey) { self.key = key }
}

public final class UIPressesEvent: NSObject {}
public final class UIEvent: NSObject {}

@MainActor public final class UITouch: NSObject {
    weak var view: UIView?
    var windowPoint: CGPoint
    let timestamp: TimeInterval

    init(view: UIView, windowPoint: CGPoint, timestamp: TimeInterval) {
        self.view = view
        self.windowPoint = windowPoint
        self.timestamp = timestamp
    }

    /// `nil`: the window (the content view's coordinates).
    public func location(in view: UIView?) -> CGPoint {
        guard let view, let root = view.window?.contentView else { return windowPoint }
        return view.convert(windowPoint, from: root)
    }
}

// MARK: - View

/// A view's layer whose transform only its view sets (see UIView.makeBackingLayer).
final class TransformLayer: CALayer {
    var owned = CATransform3DIdentity
    override var transform: CATransform3D {
        get { super.transform }
        set { super.transform = owned }
    }
}

@MainActor open class UIView: NSView {
    var parentView: UIView? { superview as? UIView }

    public struct AnimationOptions: OptionSet {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let allowUserInteraction = AnimationOptions(rawValue: 1)
        public static let beginFromCurrentState = AnimationOptions(rawValue: 2)
        public static let curveEaseInOut = AnimationOptions(rawValue: 4)
        public static let curveEaseIn = AnimationOptions(rawValue: 8)
        public static let curveEaseOut = AnimationOptions(rawValue: 16)
        public static let curveLinear = AnimationOptions(rawValue: 32)
    }

    public enum ContentMode { case scaleToFill, scaleAspectFit, scaleAspectFill }

    public override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        setUp()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setUp()
    }

    private func setUp() {
        wantsLayer = true
        layerContentsRedrawPolicy = .onSetNeedsDisplay
    }

    /// AppKit writes a layer-backed view's layer transform itself (back to identity) as it updates the layer's
    /// geometry: the layer keeps the one this view set.
    open override func makeBackingLayer() -> CALayer { TransformLayer() }

    /// UIKit's `layer` is never nil.
    public var cl: CALayer { layer! }

    open override var isFlipped: Bool { true }
    open override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    // Appearance

    public var backgroundColor: UIColor? {
        didSet { layer?.backgroundColor = backgroundColor?.cgColor }
    }

    public var alpha: CGFloat {
        get { alphaValue }
        set { alphaValue = newValue }
    }

    public var contentMode: ContentMode = .scaleToFill
    public var isUserInteractionEnabled = true

    public var transform: CGAffineTransform = .identity {
        didSet { applyTransform() }
    }

    /// The transform turns about the view's centre, as UIKit's does: the layer's anchor stays AppKit's.
    private func applyTransform() {
        guard let layer else { return }
        let c = CGPoint(x: layer.bounds.midX, y: layer.bounds.midY)
        let t = transform.isIdentity
            ? CATransform3DIdentity
            : CATransform3DMakeAffineTransform(CGAffineTransform(translationX: -c.x, y: -c.y).concatenating(transform).concatenating(CGAffineTransform(translationX: c.x, y: c.y)))
        if let own = layer as? TransformLayer { own.owned = t }
        layer.transform = t
    }

    // Geometry

    open override var frame: NSRect {
        get { super.frame }
        set {
            let moved = !transform.isIdentity
            if moved { layer?.setAffineTransform(.identity) }
            let grew = newValue.size != super.frame.size
            super.frame = newValue
            if grew {
                needsLayout = true
                needsDisplay = true
            }
            if moved { applyTransform() }
        }
    }

    /// UIKit: setting `bounds.size` resizes about the centre; the origin is the scroll offset.
    open override var bounds: NSRect {
        get { super.bounds }
        set {
            let old = super.bounds
            if newValue.size != old.size {
                let c = center
                frame = CGRect(x: c.x - newValue.width / 2, y: c.y - newValue.height / 2, width: newValue.width, height: newValue.height)
            }
            if newValue.origin != old.origin { setBoundsOrigin(newValue.origin) }
        }
    }

    public var center: CGPoint {
        get { CGPoint(x: frame.midX, y: frame.midY) }
        set { frame = CGRect(x: newValue.x - frame.width / 2, y: newValue.y - frame.height / 2, width: frame.width, height: frame.height) }
    }

    var safeInsets: UIEdgeInsets { .zero }
    open func safeAreaInsetsDidChange() {}

    // Layout

    open func layoutSubviews() {}
    open override func layout() {
        super.layout()
        layoutSubviews()
    }

    open func setNeedsLayout() { needsLayout = true }
    public func layoutIfNeeded() { layoutSubtreeIfNeeded() }

    open func sizeThatFits(_ size: CGSize) -> CGSize { bounds.size }

    open override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        didMoveToWindow()
    }

    open func didMoveToWindow() {}

    // Subviews

    public func insertSubview(_ view: NSView, at index: Int) {
        if index <= 0 {
            addSubview(view, positioned: .below, relativeTo: subviews.first)
        } else {
            addSubview(view, positioned: .above, relativeTo: subviews[min(index, subviews.count) - 1])
        }
    }

    public func bringSubviewToFront(_ view: NSView) {
        guard subviews.last !== view else { return }
        addSubview(view, positioned: .above, relativeTo: nil)
    }

    // Hit testing: `point` is in this view's coordinates.

    open func point(inside point: CGPoint, with event: UIEvent?) -> Bool { bounds.contains(point) }

    open func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard !isHidden, isUserInteractionEnabled, alphaValue > 0.01, self.point(inside: point, with: event) else { return nil }
        for sub in subviews.reversed() {
            guard let view = sub as? UIView else { continue }
            if let hit = view.hitTest(view.convert(point, from: self), with: event) { return hit }
        }
        return self
    }

    /// The AppKit view that takes the mouse when this one is hit (a field's editor).
    open var nativeHit: NSView? { nil }

    open override func hitTest(_ point: NSPoint) -> NSView? {
        let local = superview != nil ? convert(point, from: superview) : point
        guard let hit = hitTest(local, with: nil) else { return nil }
        return hit.nativeHit ?? hit
    }

    // Gestures

    public var gestures: [UIGestureRecognizer]? = []
    private var hoverArea: NSTrackingArea?

    public func addGestureRecognizer(_ g: UIGestureRecognizer) {
        gestures = (gestures ?? []) + [g]
        g.view = self
        if g is UIHoverGestureRecognizer, hoverArea == nil {
            let area = NSTrackingArea(rect: .zero, options: [.mouseEnteredAndExited, .mouseMoved, .activeInKeyWindow, .inVisibleRect], owner: self, userInfo: nil)
            addTrackingArea(area)
            hoverArea = area
        }
    }

    open override func mouseDown(with event: NSEvent) { GestureEngine.shared.down(self, event) }
    open override func mouseDragged(with event: NSEvent) { GestureEngine.shared.dragged(event) }
    open override func mouseUp(with event: NSEvent) { GestureEngine.shared.up(event) }
    open override func magnify(with event: NSEvent) { GestureEngine.shared.magnify(self, event) }
    open override func mouseEntered(with event: NSEvent) { hover(.began, event) }
    open override func mouseMoved(with event: NSEvent) { hover(.changed, event) }
    open override func mouseExited(with event: NSEvent) { hover(.ended, event) }

    private func hover(_ state: UIGestureRecognizer.State, _ event: NSEvent) {
        guard let root = window?.contentView else { return }
        let touch = UITouch(view: self, windowPoint: root.convert(event.locationInWindow, from: nil), timestamp: event.timestamp)
        for g in gestures ?? [] where g is UIHoverGestureRecognizer {
            g.touch = touch
            g.state = state
            g.fire()
        }
    }

    // Animation

    private static func context(_ duration: TimeInterval, _ options: AnimationOptions, _ body: @escaping () -> Void) {
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = duration
            ctx.allowsImplicitAnimation = duration > 0
            let name: CAMediaTimingFunctionName = options.contains(.curveLinear) ? .linear : options.contains(.curveEaseIn) ? .easeIn : options.contains(.curveEaseOut) ? .easeOut : .easeInEaseOut
            ctx.timingFunction = CAMediaTimingFunction(name: name)
            body()
        }
    }

    public static func animate(withDuration duration: TimeInterval, delay: TimeInterval = 0, options: AnimationOptions = [], animations: @escaping () -> Void) {
        if delay > 0 {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { context(duration, options, animations) }
        } else {
            context(duration, options, animations)
        }
    }

    public static func animate(
        withDuration duration: TimeInterval, delay: TimeInterval, usingSpringWithDamping damping: CGFloat, initialSpringVelocity velocity: CGFloat,
        options: AnimationOptions = [], animations: @escaping () -> Void
    ) {
        animate(withDuration: duration, delay: delay, options: options, animations: animations)
    }

    public static func performWithoutAnimation(_ actions: () -> Void) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        actions()
        CATransaction.commit()
    }
}

// MARK: - Gestures

@MainActor public protocol UIGestureRecognizerDelegate: AnyObject {
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool
}

public extension UIGestureRecognizerDelegate {
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { false }
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool { false }
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool { true }
}

@MainActor open class UIGestureRecognizer: NSObject {
    public enum State { case possible, began, changed, ended, cancelled, failed }

    open var state: State = .possible
    public weak var view: UIView?
    public weak var delegate: UIGestureRecognizerDelegate?
    public var isEnabled = true
    public var cancelsTouchesInView = true
    public var delaysTouchesEnded = true
    var touch: UITouch?
    private weak var target: AnyObject?
    private let action: Selector?

    public init(target: Any?, action: Selector?) {
        self.target = target as AnyObject?
        self.action = action
        super.init()
    }

    public func location(in view: UIView?) -> CGPoint { touch?.location(in: view) ?? .zero }

    func fire() {
        guard let target, let action else { return }
        _ = target.perform(action, with: self)
    }

    open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {}
    open func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {}
    open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {}
    open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {}
    open func reset() { state = .possible }
    open func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool { true }
    open func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool { true }
}

/// Distance the pointer may move and still be a tap or a press, in points.
private let slop: CGFloat = 10

@MainActor open class UITapGestureRecognizer: UIGestureRecognizer {
    public var numberOfTapsRequired = 1
    private var start = CGPoint.zero
    private var taps = 0
    private var last: (time: TimeInterval, point: CGPoint)?

    open override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first else { return }
        touch = t
        start = t.windowPoint
        state = .possible
    }

    open override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first, hypot(t.windowPoint.x - start.x, t.windowPoint.y - start.y) <= slop else { state = .failed; return }
        if let last, t.timestamp - last.time < 0.4, hypot(last.point.x - t.windowPoint.x, last.point.y - t.windowPoint.y) <= 3 * slop { taps += 1 } else { taps = 1 }
        last = (t.timestamp, t.windowPoint)
        if taps == numberOfTapsRequired {
            taps = 0
            state = .ended
            fire()
        }
    }
}

@MainActor open class UIPanGestureRecognizer: UIGestureRecognizer {
    private var start = CGPoint.zero
    private var origin = CGPoint.zero
    private var current = CGPoint.zero
    private var samples: [(TimeInterval, CGPoint)] = []

    open override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first else { return }
        touch = t
        start = t.windowPoint
        origin = start
        current = start
        samples = [(t.timestamp, start)]
        state = .possible
    }

    open override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first else { return }
        current = t.windowPoint
        samples.append((t.timestamp, current))
        if samples.count > 6 { samples.removeFirst() }
        switch state {
        case .possible:
            if hypot(current.x - start.x, current.y - start.y) > slop {
                origin = start
                state = .began
                fire()
            }
        case .began, .changed:
            state = .changed
            fire()
        default: break
        }
    }

    open override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        if let t = touches.first { current = t.windowPoint }
        if state == .began || state == .changed {
            state = .ended
            fire()
        } else {
            state = .failed
        }
    }

    /// Counts from where the drag was recognized, or from the last call.
    public func setTranslation(_ translation: CGPoint, in view: UIView?) {
        origin = CGPoint(x: current.x - translation.x, y: current.y - translation.y)
    }

    public func translation(in view: UIView?) -> CGPoint { CGPoint(x: current.x - origin.x, y: current.y - origin.y) }

    public func velocity(in view: UIView?) -> CGPoint {
        guard let first = samples.first, let last = samples.last, last.0 > first.0 else { return .zero }
        let dt = CGFloat(last.0 - first.0)
        return CGPoint(x: (last.1.x - first.1.x) / dt, y: (last.1.y - first.1.y) / dt)
    }
}

@MainActor open class UIPinchGestureRecognizer: UIGestureRecognizer {
    public var scale: CGFloat = 1
}

@MainActor open class UILongPressGestureRecognizer: UIGestureRecognizer {
    public var minimumPressDuration: TimeInterval = 0.5
    private var start = CGPoint.zero
    private var timer: Timer?

    open override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first else { return }
        touch = t
        start = t.windowPoint
        state = .possible
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: minimumPressDuration, repeats: false) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self, self.state == .possible else { return }
                self.state = .began
                self.fire()
            }
        }
    }

    open override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let t = touches.first, state == .possible, hypot(t.windowPoint.x - start.x, t.windowPoint.y - start.y) > slop else { return }
        timer?.invalidate()
        state = .failed
    }

    open override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        timer?.invalidate()
        if state == .began {
            state = .ended
            fire()
        } else {
            state = .failed
        }
    }
}

@MainActor open class UIHoverGestureRecognizer: UIGestureRecognizer {}

/// Routes the mouse to the recognizers of the views under it, and to the control it presses.
@MainActor final class GestureEngine {
    static let shared = GestureEngine()
    private var active: [UIGestureRecognizer] = []
    private var control: UIControl?
    private var touch: UITouch?

    private func point(_ view: NSView, _ event: NSEvent) -> CGPoint {
        view.window?.contentView.map { $0.convert(event.locationInWindow, from: nil) } ?? event.locationInWindow
    }

    func down(_ hit: UIView, _ event: NSEvent) {
        if let window = hit.window, window.firstResponder is NSText { window.makeFirstResponder(nil) }
        let t = UITouch(view: hit, windowPoint: point(hit, event), timestamp: event.timestamp)
        touch = t
        var chain: [UIGestureRecognizer] = []
        var v: NSView? = hit
        while let u = v as? UIView {
            chain += u.gestures ?? []
            v = u.superview
        }
        active = chain.filter { $0.isEnabled && ($0.delegate?.gestureRecognizer($0, shouldReceive: t) ?? true) }
        if let c = hit as? UIControl, c.isEnabled {
            control = c
            c.isHighlighted = true
        }
        let event = UIEvent()
        for g in active {
            g.touch = t
            g.touchesBegan([t], with: event)
        }
    }

    func dragged(_ event: NSEvent) {
        guard let t = touch, let view = t.view else { return }
        t.windowPoint = point(view, event)
        if let c = control { c.isHighlighted = c.point(inside: c.convert(t.windowPoint, from: c.window?.contentView), with: nil) }
        let e = UIEvent()
        for g in active { g.touchesMoved([t], with: e) }
    }

    func up(_ event: NSEvent) {
        guard let t = touch, let view = t.view else { return }
        t.windowPoint = point(view, event)
        let e = UIEvent()
        for g in active { g.touchesEnded([t], with: e) }
        if let c = control {
            let inside = c.point(inside: c.convert(t.windowPoint, from: c.window?.contentView), with: nil)
            c.isHighlighted = false
            if inside && c.isEnabled { c.sendActions(for: .touchUpInside) }
        }
        for g in active { g.reset() }
        active = []
        control = nil
        touch = nil
    }

    func magnify(_ hit: UIView, _ event: NSEvent) {
        let t = UITouch(view: hit, windowPoint: point(hit, event), timestamp: event.timestamp)
        var v: NSView? = hit
        while let u = v as? UIView {
            for g in u.gestures ?? [] {
                guard let pinch = g as? UIPinchGestureRecognizer, pinch.isEnabled else { continue }
                pinch.touch = t
                switch event.phase {
                case .began:
                    pinch.scale = 1
                    pinch.state = .began
                case .changed:
                    pinch.scale *= 1 + event.magnification
                    pinch.state = .changed
                default:
                    pinch.state = .ended
                }
                pinch.fire()
                if pinch.state == .ended { pinch.reset() }
            }
            v = u.superview
        }
    }
}

// MARK: - Controls

@MainActor public final class UIAction: NSObject {
    public typealias Handler = @MainActor (UIAction) -> Void
    let handler: Handler
    public init(title: String = "", handler: @escaping Handler) {
        self.handler = handler
        super.init()
    }
}

@MainActor open class UIControl: UIView {
    public struct Event: OptionSet {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let touchUpInside = Event(rawValue: 1)
        public static let valueChanged = Event(rawValue: 2)
        public static let editingDidBegin = Event(rawValue: 4)
        public static let editingChanged = Event(rawValue: 8)
        public static let editingDidEnd = Event(rawValue: 16)
        public static let editingDidEndOnExit = Event(rawValue: 32)
    }

    private var actions: [(Event, UIAction)] = []
    open var isEnabled = true
    open var isHighlighted = false

    public func addAction(_ action: UIAction, for event: Event) { actions.append((event, action)) }

    public func sendActions(for event: Event) {
        for (e, action) in actions where e == event { action.handler(action) }
    }
}

// MARK: - Text

/// TextKit layout of an attributed string, as UILabel lays it out: no padding, truncating at `lines`.
@MainActor private func textLayout(_ text: NSAttributedString, width: CGFloat, lines: Int, mode: NSLineBreakMode) -> (NSLayoutManager, NSTextContainer, CGSize, NSTextStorage) {
    let storage = NSTextStorage(attributedString: text)
    let manager = NSLayoutManager()
    let container = NSTextContainer(size: CGSize(width: max(1, width), height: 1e7))
    container.lineFragmentPadding = 0
    container.maximumNumberOfLines = lines
    container.lineBreakMode = lines == 0 ? .byWordWrapping : mode
    manager.addTextContainer(container)
    storage.addLayoutManager(manager)
    manager.ensureLayout(for: container)
    return (manager, container, manager.usedRect(for: container).size, storage)
}

@MainActor open class UILabel: UIView {
    open var text: String? {
        didSet { content = nil; changed() }
    }
    open var attributedText: NSAttributedString? {
        didSet { changed() }
    }
    open var font: UIFont = .systemFont(ofSize: 17) { didSet { changed() } }
    open var textColor: UIColor = .black { didSet { changed() } }
    open var textAlignment: NSTextAlignment = .natural { didSet { changed() } }
    open var numberOfLines = 1 { didSet { changed() } }
    open var lineBreakMode: NSLineBreakMode = .byTruncatingTail { didSet { changed() } }
    private var content: NSAttributedString?

    public override init(frame: NSRect) { super.init(frame: frame) }
    public required init?(coder: NSCoder) { super.init(coder: coder) }

    private func changed() {
        needsDisplay = true
        invalidateIntrinsicContentSize()
    }

    private var drawn: NSAttributedString {
        if let attributedText { return attributedText }
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = textAlignment
        return NSAttributedString(string: text ?? "", attributes: [.font: font, .foregroundColor: textColor, .paragraphStyle: paragraph])
    }

    open override func draw(_ dirtyRect: NSRect) { drawText(in: bounds) }

    /// Draws the text, centred vertically in `rect`, as UILabel does.
    open func drawText(in rect: CGRect) {
        let (manager, container, size, storage) = textLayout(drawn, width: rect.width, lines: numberOfLines, mode: lineBreakMode)
        let y = rect.minY + max(0, (rect.height - size.height) / 2)
        // The layout manager does not keep its storage alive.
        withExtendedLifetime(storage) { manager.drawGlyphs(forGlyphRange: manager.glyphRange(for: container), at: CGPoint(x: rect.minX, y: y)) }
    }

    open override func sizeThatFits(_ size: CGSize) -> CGSize {
        let (_, _, fit, _) = textLayout(drawn, width: size.width, lines: numberOfLines, mode: lineBreakMode)
        // Up to the device pixel, as a browser lays text out.
        let scale = window?.backingScaleFactor ?? NSScreen.main?.backingScaleFactor ?? 2
        return CGSize(width: ceil(fit.width * scale) / scale, height: ceil(fit.height))
    }
}

/// An NSTextField / NSTextView that edits inside a UIKit-shaped view.
/// Reports taking the focus: AppKit's delegate only hears of editing once the first key is typed.
final class FocusField: NSTextField {
    var onFocus: (() -> Void)?
    override func becomeFirstResponder() -> Bool {
        let took = super.becomeFirstResponder()
        if took { onFocus?() }
        return took
    }
}

@MainActor open class UITextField: UIControl, NSTextFieldDelegate {
    private let field = FocusField()
    private static var monitored = false

    public override init(frame: NSRect) {
        super.init(frame: frame)
        field.isBordered = false
        field.drawsBackground = false
        field.focusRingType = .none
        field.usesSingleLineMode = true
        field.cell?.isScrollable = true
        field.delegate = self
        field.onFocus = { [weak self] in self?.sendActions(for: .editingDidBegin) }
        addSubview(field)
        Self.monitorKeys()
    }

    public required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    open var text: String? {
        get { field.stringValue }
        set { field.stringValue = newValue ?? "" }
    }
    open var font: UIFont? {
        get { field.font }
        set { field.font = newValue }
    }
    open var textColor: UIColor? {
        get { field.textColor }
        set { field.textColor = newValue }
    }
    open var textAlignment: NSTextAlignment {
        get { field.alignment }
        set { field.alignment = newValue }
    }
    open var placeholder: String? {
        get { field.placeholderString }
        set { field.placeholderString = newValue }
    }
    public var attributedPlaceholder: NSAttributedString? {
        get { field.placeholderAttributedString }
        set { field.placeholderAttributedString = newValue }
    }
    open override var isEnabled: Bool {
        didSet { field.isEnabled = isEnabled }
    }
    // ponytail: an NSTextField cannot become secure in place; a password field shows its text until it is swapped for NSSecureTextField.
    public var isSecureTextEntry = false

    open func textRect(forBounds bounds: CGRect) -> CGRect { bounds }
    open func editingRect(forBounds bounds: CGRect) -> CGRect { bounds }
    open func placeholderRect(forBounds bounds: CGRect) -> CGRect { bounds }
    open func deleteBackward() {}
    open func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {}

    open override func layoutSubviews() {
        super.layoutSubviews()
        field.frame = editingRect(forBounds: bounds)
    }

    open override var nativeHit: NSView? { field }

    public func controlTextDidChange(_ obj: Notification) { sendActions(for: .editingChanged) }
    public func controlTextDidEndEditing(_ obj: Notification) {
        sendActions(for: .editingDidEnd)
        if obj.userInfo?["NSTextMovement"] as? Int == NSTextMovement.return.rawValue { sendActions(for: .editingDidEndOnExit) }
    }

    /// Hardware keys, as UIKit reports them to a field: one monitor for every field.
    private static func monitorKeys() {
        guard !monitored else { return }
        monitored = true
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            MainActor.assumeIsolated {
                guard let editor = event.window?.firstResponder as? NSText, let owner = (editor.delegate as? NSTextField)?.superview as? UITextField else { return event }
                let code: UIKeyboardHIDUsage
                switch event.keyCode {
                case 53: code = .keyboardEscape
                case 48: code = .keyboardTab
                case 117: code = .keyboardDeleteForward
                case 123: code = .keyboardLeftArrow
                case 124: code = .keyboardRightArrow
                case 126: code = .keyboardUpArrow
                case 125: code = .keyboardDownArrow
                case 36, 76: code = .keyboardReturnOrEnter
                case 51:
                    owner.deleteBackward()
                    code = .keyboardDeleteOrBackspace
                default: code = .other
                }
                owner.pressesBegan([UIPress(key: UIKey(keyCode: code, characters: event.characters ?? ""))], with: nil)
                return event
            }
        }
    }
}

@MainActor public protocol UITextViewDelegate: AnyObject {
    func textViewDidChange(_ textView: UITextView)
    func textViewDidBeginEditing(_ textView: UITextView)
    func textViewDidEndEditing(_ textView: UITextView)
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool
}

public extension UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {}
    func textViewDidBeginEditing(_ textView: UITextView) {}
    func textViewDidEndEditing(_ textView: UITextView) {}
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool { true }
}

@MainActor open class UITextView: UIView, NSTextViewDelegate {
    private let inner = NSTextView()
    public weak var delegate: UITextViewDelegate?
    public var isScrollEnabled = true
    public var textContainerInset = UIEdgeInsets.zero { didSet { needsLayout = true } }
    public var textContainer: NSTextContainer { inner.textContainer! }

    public override init(frame: NSRect) {
        super.init(frame: frame)
        inner.drawsBackground = false
        inner.isRichText = false
        inner.isVerticallyResizable = false
        inner.isHorizontallyResizable = false
        inner.textContainerInset = .zero
        inner.delegate = self
        addSubview(inner)
    }

    public required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    open var text: String! {
        get { inner.string }
        set { inner.string = newValue ?? "" }
    }
    open var font: UIFont? {
        get { inner.font }
        set { inner.font = newValue }
    }
    open var textColor: UIColor? {
        get { inner.textColor }
        set { inner.textColor = newValue }
    }
    open var textAlignment: NSTextAlignment {
        get { inner.alignment }
        set { inner.alignment = newValue }
    }

    open override func layoutSubviews() {
        super.layoutSubviews()
        inner.frame = bounds.inset(by: textContainerInset)
    }

    open override var nativeHit: NSView? { inner }

    open override func sizeThatFits(_ size: CGSize) -> CGSize {
        let width = max(1, size.width - textContainerInset.left - textContainerInset.right)
        let container = NSTextContainer(size: CGSize(width: width, height: 1e7))
        container.lineFragmentPadding = textContainer.lineFragmentPadding
        let manager = NSLayoutManager()
        let storage = NSTextStorage(attributedString: inner.attributedString())
        manager.addTextContainer(container)
        storage.addLayoutManager(manager)
        manager.ensureLayout(for: container)
        let line = (font ?? .systemFont(ofSize: 15)).lineHeight
        let used = max(manager.usedRect(for: container).height, line)
        return CGSize(width: size.width, height: ceil(used) + textContainerInset.top + textContainerInset.bottom)
    }

    public func textDidChange(_ notification: Notification) { delegate?.textViewDidChange(self) }
    public func textDidBeginEditing(_ notification: Notification) { delegate?.textViewDidBeginEditing(self) }
    public func textDidEndEditing(_ notification: Notification) { delegate?.textViewDidEndEditing(self) }
    public func textView(_ textView: NSTextView, shouldChangeTextIn affectedCharRange: NSRange, replacementString: String?) -> Bool {
        delegate?.textView(self, shouldChangeTextIn: affectedCharRange, replacementText: replacementString ?? "") ?? true
    }
}

// MARK: - Other controls

/// `input({ type: "checkbox" })`: on a Mac the platform's checkbox (as a browser draws one), not a switch.
@MainActor open class UISwitch: UIControl {
    private let toggle = NSButton(checkboxWithTitle: "", target: nil, action: nil)

    public override init(frame: NSRect) {
        super.init(frame: frame)
        toggle.sizeToFit()
        toggle.target = self
        toggle.action = #selector(flipped)
        addSubview(toggle)
    }

    public required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    public var isOn: Bool {
        get { toggle.state == .on }
        set { toggle.state = newValue ? .on : .off }
    }

    public func setOn(_ on: Bool, animated: Bool) { isOn = on }

    @objc private func flipped() { sendActions(for: .valueChanged) }

    open override func layoutSubviews() {
        super.layoutSubviews()
        toggle.frame = CGRect(x: (bounds.width - toggle.frame.width) / 2, y: (bounds.height - toggle.frame.height) / 2, width: toggle.frame.width, height: toggle.frame.height)
    }

    open override var nativeHit: NSView? { toggle }
}

@MainActor open class UIImageView: UIView {
    public var image: UIImage? { didSet { needsDisplay = true } }

    public override init(frame: NSRect) { super.init(frame: frame) }
    public required init?(coder: NSCoder) { super.init(coder: coder) }

    open override func draw(_ dirtyRect: NSRect) {
        guard let image, image.size.width > 0, image.size.height > 0 else { return }
        var target = bounds
        switch contentMode {
        case .scaleToFill: break
        case .scaleAspectFill, .scaleAspectFit:
            let sx = bounds.width / image.size.width, sy = bounds.height / image.size.height
            let k = contentMode == .scaleAspectFill ? max(sx, sy) : min(sx, sy)
            let w = image.size.width * k, h = image.size.height * k
            target = CGRect(x: (bounds.width - w) / 2, y: (bounds.height - h) / 2, width: w, height: h)
        }
        NSBezierPath(rect: bounds).addClip()
        image.draw(in: target, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
    }
}

// MARK: - Scrolling

@MainActor public protocol UIScrollViewDelegate: AnyObject {
    func scrollViewDidScroll(_ scrollView: UIScrollView)
}

public extension UIScrollViewDelegate {
    func scrollViewDidScroll(_ scrollView: UIScrollView) {}
}

/// Scrolls by the bounds' origin, as UIKit does; the wheel and the trackpad move it.
@MainActor open class UIScrollView: UIView {
    public enum ContentInsetAdjustmentBehavior { case automatic, never }
    public enum KeyboardDismissMode { case none, onDrag, interactive }

    public weak var delegate: UIScrollViewDelegate?
    public var contentInsetAdjustmentBehavior = ContentInsetAdjustmentBehavior.automatic
    public var showsHorizontalScrollIndicator = true
    public var showsVerticalScrollIndicator = true
    public var alwaysBounceVertical = false
    public var keyboardDismissMode = KeyboardDismissMode.none
    public var adjustedContentInset: UIEdgeInsets { .zero }

    public var contentSize = CGSize.zero {
        didSet { if contentSize != oldValue { clamp() } }
    }

    public var contentOffset: CGPoint {
        get { bounds.origin }
        set {
            let next = limited(newValue)
            guard next != bounds.origin else { return }
            setBoundsOrigin(next)
            delegate?.scrollViewDidScroll(self)
        }
    }

    public override init(frame: NSRect) {
        super.init(frame: frame)
        clipsToBounds = true
    }

    public required init?(coder: NSCoder) { super.init(coder: coder) }

    private func limited(_ p: CGPoint) -> CGPoint {
        CGPoint(
            x: min(max(0, p.x), max(0, contentSize.width - bounds.width)),
            y: min(max(0, p.y), max(0, contentSize.height - bounds.height))
        )
    }

    private func clamp() { contentOffset = contentOffset }

    open override func scrollWheel(with event: NSEvent) {
        let dx = event.hasPreciseScrollingDeltas ? event.scrollingDeltaX : event.scrollingDeltaX * 10
        let dy = event.hasPreciseScrollingDeltas ? event.scrollingDeltaY : event.scrollingDeltaY * 10
        let canX = contentSize.width > bounds.width + 0.5, canY = contentSize.height > bounds.height + 0.5
        guard (canX && dx != 0) || (canY && dy != 0) else {
            super.scrollWheel(with: event)
            return
        }
        contentOffset = CGPoint(x: contentOffset.x - (canX ? dx : 0), y: contentOffset.y - (canY ? dy : 0))
    }
}

// MARK: - Controllers

@MainActor public protocol UINavigationControllerDelegate: AnyObject {
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool)
}

public extension UINavigationControllerDelegate {
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {}
}

@MainActor public protocol UITabBarControllerDelegate: AnyObject {
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController)
}

public extension UITabBarControllerDelegate {
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {}
}

@MainActor public protocol UIAdaptivePresentationControllerDelegate: AnyObject {
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController)
}

public extension UIAdaptivePresentationControllerDelegate {
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {}
}

@MainActor public final class UIPresentationController: NSObject {
    public let presentedViewController: UIViewController
    public weak var delegate: UIAdaptivePresentationControllerDelegate?
    init(_ presented: UIViewController) { presentedViewController = presented }
}

public final class UINavigationItem {
    public enum LargeTitleDisplayMode { case automatic, always, never }
    public var largeTitleDisplayMode = LargeTitleDisplayMode.automatic
}

public final class UINavigationBar {
    public var prefersLargeTitles = false
}

public final class UITabBarItem {
    public let title: String?
    public let image: UIImage?
    public let tag: Int
    public init(title: String?, image: UIImage?, tag: Int) { self.title = title; self.image = image; self.tag = tag }
}

@MainActor open class UIViewController: NSObject {
    public enum ModalPresentationStyle { case fullScreen, pageSheet }

    open var title: String?
    private var loaded: UIView?
    public private(set) var children: [UIViewController] = []
    public private(set) weak var parent: UIViewController?
    public private(set) var presentedViewController: UIViewController?
    public fileprivate(set) weak var presentingViewController: UIViewController?
    public var modalPresentationStyle = ModalPresentationStyle.fullScreen
    public let navigationItem = UINavigationItem()
    public var tabBarItem: UITabBarItem!
    private var presentation: UIPresentationController?
    private var sheet: SheetView?

    public override init() { super.init() }
    public init(nibName: String?, bundle: Bundle?) { super.init() }
    public required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    open func loadView() { loaded = UIView() }
    open func viewDidLoad() {}
    open func viewWillAppear(_ animated: Bool) {}

    public var view: UIView! {
        get {
            if loaded == nil {
                loadView()
                if loaded == nil { loaded = UIView() }
                viewDidLoad()
            }
            return loaded
        }
        set { loaded = newValue }
    }

    public var presentationController: UIPresentationController? {
        if presentation == nil { presentation = UIPresentationController(self) }
        return presentation
    }

    public var navigationController: UINavigationController? {
        var c: UIViewController? = self
        while let current = c {
            if let n = current as? UINavigationController { return n }
            c = current.parent
        }
        return nil
    }

    public func addChild(_ child: UIViewController) {
        child.parent?.children.removeAll { $0 === child }
        child.parent = self
        children.append(child)
    }

    public func removeFromParent() {
        parent?.children.removeAll { $0 === self }
        parent = nil
    }

    public func willMove(toParent parent: UIViewController?) {}
    public func didMove(toParent parent: UIViewController?) {}

    public func present(_ controller: UIViewController, animated: Bool, completion: (() -> Void)? = nil) {
        presentedViewController = controller
        controller.presentingViewController = self
        var root: NSView = view
        while let up = root.superview, !(up is NSClipView) { root = up }
        let sheet = SheetView(controller)
        sheet.frame = root.bounds
        sheet.autoresizingMask = [.width, .height]
        root.addSubview(sheet)
        controller.sheet = sheet
        controller.viewWillAppear(animated)
        completion?()
    }

    public func dismiss(animated: Bool, completion: (() -> Void)? = nil) {
        if let presented = presentedViewController {
            presented.sheet?.removeFromSuperview()
            presented.sheet = nil
            presented.presentingViewController = nil
            presentedViewController = nil
        } else if let presenter = presentingViewController {
            presenter.dismiss(animated: animated, completion: completion)
            return
        }
        completion?()
    }

    fileprivate func dismissedByUser() {
        let ours = presentationController
        dismiss(animated: true)
        if let ours { ours.delegate?.presentationControllerDidDismiss(ours) }
    }
}

/// A modal screen: a dimmed backdrop, and the screen as a sheet 24 pt below the top.
@MainActor private final class SheetView: UIView {
    private let controller: UIViewController
    private let backdrop = UIView()

    init(_ controller: UIViewController) {
        self.controller = controller
        super.init(frame: .zero)
        backdrop.backgroundColor = NSColor(white: 0, alpha: 0.3)
        addSubview(backdrop)
        let content = controller.view!
        content.cl.cornerRadius = 12
        content.cl.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        content.clipsToBounds = true
        addSubview(content)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        backdrop.frame = bounds
        controller.view.frame = CGRect(x: 0, y: 24, width: bounds.width, height: max(0, bounds.height - 24))
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        return hit === self ? backdrop : hit
    }

    // A click on the dimmed backdrop dismisses the sheet.
    override func mouseUp(with event: NSEvent) {
        let p = convert(event.locationInWindow, from: nil)
        if p.y < 24 { controller.dismissedByUser() }
        super.mouseUp(with: event)
    }
}

/// A bar of the chrome: white, with a hairline shadow, `h` tall.
@MainActor private final class ChromeBar: UIView {
    let title = UILabel()
    let back = UILabel()
    var onBack: (() -> Void)?
    var showsBack = false { didSet { needsLayout = true } }

    override init(frame: NSRect) {
        super.init(frame: frame)
        backgroundColor = .white
        cl.shadowOpacity = 0.2
        cl.shadowRadius = 2
        cl.shadowOffset = CGSize(width: 0, height: -1)
        title.font = .systemFont(ofSize: 20, weight: .bold)
        title.attributedText = nil
        title.numberOfLines = 1
        back.font = .systemFont(ofSize: 24)
        back.text = "←"
        back.textAlignment = .center
        back.isUserInteractionEnabled = false
        addSubview(title)
        addSubview(back)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        back.isHidden = !showsBack
        back.frame = CGRect(x: 0, y: 0, width: 56, height: bounds.height)
        // Where the web puts it: after the back button, or after its 20 pt stand-in.
        let x: CGFloat = showsBack ? 56 : 20
        title.frame = CGRect(x: x, y: 0, width: max(0, bounds.width - x - 16), height: bounds.height)
    }

    override func mouseUp(with event: NSEvent) {
        if showsBack, convert(event.locationInWindow, from: nil).x < 56 { onBack?() }
    }
}

@MainActor private final class NavigationView: UIView {
    let bar = ChromeBar()
    var content: UIView?
    var barHidden = false { didSet { needsLayout = true } }

    override init(frame: NSRect) {
        super.init(frame: frame)
        backgroundColor = .white
        addSubview(bar)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        let h: CGFloat = barHidden ? 0 : 56
        bar.isHidden = barHidden
        bar.frame = CGRect(x: 0, y: 0, width: bounds.width, height: h)
        content?.frame = CGRect(x: 0, y: h, width: bounds.width, height: max(0, bounds.height - h))
    }
}

@MainActor open class UINavigationController: UIViewController {
    public let navigationBar = UINavigationBar()
    public weak var delegate: UINavigationControllerDelegate?
    public private(set) var viewControllers: [UIViewController] = []
    private let shell = NavigationView()

    public init(rootViewController: UIViewController) {
        super.init(nibName: nil, bundle: nil)
        shell.bar.onBack = { [weak self] in _ = self?.popViewController(animated: true) }
        setViewControllers([rootViewController], animated: false)
    }

    public required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    open override func loadView() { view = shell }

    public func setNavigationBarHidden(_ hidden: Bool, animated: Bool) { shell.barHidden = hidden }

    public func setViewControllers(_ controllers: [UIViewController], animated: Bool) {
        for old in viewControllers where !controllers.contains(where: { $0 === old }) { old.removeFromParent() }
        for c in controllers where c.parent !== self { addChild(c) }
        viewControllers = controllers
        show()
    }

    public func pushViewController(_ controller: UIViewController, animated: Bool) {
        addChild(controller)
        viewControllers.append(controller)
        show()
    }

    @discardableResult public func popViewController(animated: Bool) -> UIViewController? {
        guard viewControllers.count > 1 else { return nil }
        let top = viewControllers.removeLast()
        top.removeFromParent()
        show()
        return top
    }

    private func show() {
        guard let top = viewControllers.last else { return }
        _ = view
        if shell.content !== top.view {
            shell.content?.removeFromSuperview()
            shell.content = top.view
            shell.addSubview(top.view)
        }
        shell.bar.title.text = top.title
        shell.bar.showsBack = viewControllers.count > 1
        top.viewWillAppear(false)
        shell.needsLayout = true
        delegate?.navigationController(self, didShow: top, animated: false)
    }
}

@MainActor private final class TabItemView: UIView {
    let icon = NSImageView()
    let label = UILabel()
    var onTap: (() -> Void)?
    var selected = false {
        didSet {
            let tint = selected ? NSColor(srgbRed: 0x4f / 255.0, green: 0x46 / 255.0, blue: 0xe5 / 255.0, alpha: 1) : NSColor(srgbRed: 0x64 / 255.0, green: 0x74 / 255.0, blue: 0x8b / 255.0, alpha: 1)
            label.textColor = tint
            icon.contentTintColor = tint
        }
    }

    init(_ item: UITabBarItem?) {
        super.init(frame: .zero)
        icon.image = item?.image
        label.text = item?.title
        label.font = .systemFont(ofSize: 12)
        label.textAlignment = .center
        label.isUserInteractionEnabled = false
        addSubview(icon)
        addSubview(label)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        icon.frame = CGRect(x: (bounds.width - 22) / 2, y: 12, width: 22, height: 22)
        label.frame = CGRect(x: 0, y: 38, width: bounds.width, height: 16)
    }

    override func mouseUp(with event: NSEvent) { onTap?() }
}

@MainActor private final class TabView: UIView {
    var content: UIView?
    var items: [TabItemView] = []

    override init(frame: NSRect) {
        super.init(frame: frame)
        backgroundColor = .white
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        let bar: CGFloat = items.isEmpty ? 0 : 64
        content?.frame = CGRect(x: 0, y: 0, width: bounds.width, height: max(0, bounds.height - bar))
        let w = bounds.width / CGFloat(max(1, items.count))
        for (i, item) in items.enumerated() { item.frame = CGRect(x: CGFloat(i) * w, y: bounds.height - bar, width: w, height: bar) }
    }
}

@MainActor open class UITabBarController: UIViewController {
    public weak var delegate: UITabBarControllerDelegate?
    private let shell = TabView()
    private var bar: [TabItemView] = []

    public var viewControllers: [UIViewController]? {
        didSet {
            for c in viewControllers ?? [] { addChild(c) }
            for item in shell.items { item.removeFromSuperview() }
            bar = (viewControllers ?? []).enumerated().map { i, c in
                let item = TabItemView(c.tabBarItem)
                item.onTap = { [weak self] in self?.choose(i, notify: true) }
                shell.addSubview(item)
                return item
            }
            shell.items = bar
            choose(selectedIndex, notify: false)
        }
    }

    public var selectedIndex = 0 {
        didSet { if selectedIndex != oldValue { choose(selectedIndex, notify: false) } }
    }

    open override func loadView() { view = shell }

    private func choose(_ index: Int, notify: Bool) {
        guard let controllers = viewControllers, controllers.indices.contains(index) else { return }
        _ = view
        selectedIndex = index
        let top = controllers[index]
        if shell.content !== top.view {
            shell.content?.removeFromSuperview()
            shell.content = top.view
            shell.addSubview(top.view, positioned: .below, relativeTo: nil)
        }
        for (i, item) in bar.enumerated() { item.selected = i == index }
        top.viewWillAppear(false)
        shell.needsLayout = true
        if notify { delegate?.tabBarController(self, didSelect: top) }
    }
}

// MARK: - Display link

/// A callback per frame: a 60 Hz timer.
@MainActor public final class CADisplayLink: NSObject {
    private weak var target: AnyObject?
    private let selector: Selector
    private var timer: Timer?

    public init(target: Any, selector: Selector) {
        self.target = target as AnyObject
        self.selector = selector
    }

    public func add(to runLoop: RunLoop, forMode mode: RunLoop.Mode) {
        let timer = Timer(timeInterval: 1.0 / 60, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self, let target = self.target else { return }
                _ = target.perform(self.selector)
            }
        }
        runLoop.add(timer, forMode: mode)
        self.timer = timer
    }

    public func invalidate() {
        timer?.invalidate()
        timer = nil
    }
}
#endif
