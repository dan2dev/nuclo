// nuclo-native host for macOS and iOS: AppKit / UIKit views driven by JavaScriptCore.
// Navigation (tabs, stacks, screens) lives in Navigation.swift, device data (battery) in Device.swift.
//
// macOS: swiftc -swift-version 6 hosts/apple/*.swift -o dist/nuclo-app && dist/nuclo-app dist/app.js
// iOS:   add hosts/apple/*.swift and dist/app.js to an iOS app target (no storyboard, no scene manifest).
import CoreText
import JavaScriptCore

#if os(macOS)
import AppKit
typealias View = NSView
typealias Control = NSControl
typealias Color = NSColor
typealias Font = NSFont
typealias Tap = NSClickGestureRecognizer
typealias ViewController = NSViewController
typealias Window = NSWindow

extension NSView {
    var alpha: CGFloat { get { alphaValue } set { alphaValue = newValue } }
}
extension NSTextField {
    var text: String? { get { stringValue } set { stringValue = newValue ?? "" } }
    var placeholder: String? { get { placeholderString } set { placeholderString = newValue } }
}

/// An image that covers its box, cropped, like UIKit's .scaleAspectFill: NSImageView can only fit.
final class ImageView: NSView {
    var image: NSImage? {
        didSet { needsDisplay = true }
    }

    override func draw(_ dirtyRect: NSRect) {
        guard let image, image.size.width > 0, image.size.height > 0 else { return }
        NSBezierPath(rect: bounds).addClip()
        let scale = max(bounds.width / image.size.width, bounds.height / image.size.height)
        let size = NSSize(width: image.size.width * scale, height: image.size.height * scale)
        image.draw(in: NSRect(x: bounds.midX - size.width / 2, y: bounds.midY - size.height / 2, width: size.width, height: size.height))
    }
}
/// An input: its text centred in the box and 8 points in, as the browser pads it (layout.ts).
final class Field: NSTextField {
    override class var cellClass: AnyClass? {
        get { FieldCell.self }
        set {}
    }
}

final class FieldCell: NSTextFieldCell {
    override func drawingRect(forBounds rect: NSRect) -> NSRect {
        let height = NSLayoutManager().defaultLineHeight(for: font ?? NSFont.systemFont(ofSize: 14))
        // The field editor adds 2 points of line padding.
        return NSRect(x: rect.minX + 6, y: rect.midY - height / 2, width: max(0, rect.width - 12), height: height)
    }
}
#else
import UIKit
typealias View = UIView
typealias Control = UIControl
typealias Color = UIColor
typealias Font = UIFont
typealias ImageView = UIImageView
typealias Tap = UITapGestureRecognizer
typealias ViewController = UIViewController
typealias Window = UIWindow
#endif

func color(_ hex: String) -> Color {
    var digits = String(hex.dropFirst())
    if digits.count == 3 { digits = digits.map { "\($0)\($0)" }.joined() }
    let rgb = UInt32(digits, radix: 16) ?? 0
    return Color(red: CGFloat(rgb >> 16 & 255) / 255, green: CGFloat(rgb >> 8 & 255) / 255, blue: CGFloat(rgb & 255) / 255, alpha: 1)
}

func px(_ value: String) -> CGFloat {
    CGFloat(Double(value.replacingOccurrences(of: "px", with: "")) ?? 0)
}

/// A container. JS lays its children out (layout.ts) and sends their frames; the box only holds them.
final class Box: View {
    /// The body reports its size: it is the layout root of an app without the router.
    var resized: ((CGSize) -> Void)?

    #if os(macOS)
    override var isFlipped: Bool { true }
    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        resized?(newSize)
    }
    #else
    override func layoutSubviews() {
        super.layoutSubviews()
        resized?(bounds.size)
    }

    // Tappable views dim while pressed, as UIKit buttons do. In a scroll view
    // the press shows after UIKit's short touch delay, so scrolling never flashes.
    var pressable = false
    var restAlpha: CGFloat = 1 { didSet { alpha = restAlpha } }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        if pressable { alpha = restAlpha * 0.5 }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        release()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        release()
    }

    private func release() {
        guard pressable else { return }
        UIView.animate(withDuration: 0.25) { self.alpha = self.restAlpha }
    }
    #endif
}

// ── Text, the contract's way (layout.ts): the bundled font, line height 1.35 × size ──

// Text is black (white in dark mode), as the browser draws it.
#if os(macOS)
let labelColor = NSColor(name: nil) { $0.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? .white : .black }
#else
let labelColor = UIColor.label
#endif

/// Inter, or the OS font for `fontFamily: "system"`.
func textFont(size: CGFloat = 14, bold: Bool = false, system: Bool = false) -> Font {
    if !system, let inter = Font(name: bold ? "Inter-Bold" : "Inter-Regular", size: size) { return inter }
    return Font.systemFont(ofSize: size, weight: bold ? .bold : .regular)
}

/// Device pixels per point.
@MainActor func deviceScale() -> CGFloat {
    #if os(macOS)
    host.window?.backingScaleFactor ?? 2
    #else
    host.window?.screen.scale ?? 3
    #endif
}

/// A line's height: 1.35 × the font size on the browser's 1/64 device-pixel grid (layout.ts lineHeight).
func lineHeight(_ font: Font, scale: CGFloat) -> CGFloat {
    (font.pointSize * 1.35 * scale * 64 + 1e-6).rounded(.down) / (scale * 64)
}

/// Where the browser puts the baseline in a line, `scale` device pixels per point (Blink lays
/// text out in device pixels): ascent and descent rounded to device pixels, then half the
/// leading above them, floored to a device pixel.
func baseline(_ font: Font, scale: CGFloat) -> CGFloat {
    let ascent = (font.ascender * scale).rounded(), descent = (-font.descender * scale).rounded()
    let leading = lineHeight(font, scale: scale) * scale - ascent - descent
    return (ascent + (leading / 2).rounded(.down)) / scale
}

/// A text broken into lines the way it is drawn (CoreText, wrapping at `maxWidth`; < 0: only at newlines).
struct Typeset {
    let lines: [CTLine]
    let widths: [CGFloat]

    init(_ text: String, _ font: Font, color: Color = labelColor, maxWidth: CGFloat) {
        let ctFont = CTFontCreateWithName(font.fontName as CFString, font.pointSize, nil)
        let string = NSAttributedString(string: text, attributes: [
            NSAttributedString.Key(kCTFontAttributeName as String): ctFont,
            NSAttributedString.Key(kCTForegroundColorAttributeName as String): color.cgColor,
        ])
        let typesetter = CTTypesetterCreateWithAttributedString(string)
        var lines: [CTLine] = []
        var start = 0
        while start < string.length {
            let count = max(1, CTTypesetterSuggestLineBreak(typesetter, start, maxWidth < 0 ? 1e7 : Double(maxWidth)))
            lines.append(CTTypesetterCreateLine(typesetter, CFRange(location: start, length: count)))
            start += count
        }
        self.lines = lines
        // Trailing spaces hang past the line, as in CSS.
        widths = lines.map { CGFloat(CTLineGetTypographicBounds($0, nil, nil, nil) - CTLineGetTrailingWhitespaceWidth($0)) }
    }

    /// Widths round up, so the box JS sends back always fits the text.
    func size(_ font: Font, scale: CGFloat) -> CGSize {
        CGSize(width: ceil((widths.max() ?? 0) * 100 - 0.001) / 100, height: CGFloat(lines.count) * lineHeight(font, scale: scale))
    }
}

/// A text, drawn directly with CoreText: what is measured is exactly what is drawn, line by line
/// at the browser's baselines.
final class TextView: View {
    var text = "" { didSet { changed() } }
    var font = textFont() { didSet { changed() } }
    var color = labelColor { didSet { changed() } }
    var alignment = NSTextAlignment.left { didSet { changed() } }
    var padding: CGFloat = 0 { didSet { changed() } }
    /// The box JS laid out, relative to the one drawn: frames are snapped to device pixels, text is
    /// broken and placed as measured.
    var layout = CGRect.zero { didSet { if layout != oldValue { changed() } } }

    func measure(_ maxWidth: CGFloat, scale: CGFloat) -> CGSize { Typeset(text, font, maxWidth: maxWidth).size(font, scale: scale) }

    override init(frame: CGRect) {
        super.init(frame: frame)
        #if os(macOS)
        setAccessibilityElement(true)
        setAccessibilityRole(.staticText)
        #else
        isOpaque = false
        contentMode = .redraw
        isAccessibilityElement = true
        accessibilityTraits = .staticText
        #endif
    }

    required init?(coder: NSCoder) { fatalError() }

    #if os(macOS)
    override var isFlipped: Bool { true }
    #endif

    private func changed() {
        #if os(macOS)
        setAccessibilityLabel(text)
        needsDisplay = true
        #else
        accessibilityLabel = text
        setNeedsDisplay()
        #endif
    }

    override func draw(_ rect: CGRect) {
        #if os(macOS)
        guard let context = NSGraphicsContext.current?.cgContext else { return }
        #else
        guard let context = UIGraphicsGetCurrentContext() else { return }
        #endif
        let box = (layout.isEmpty ? bounds : layout).insetBy(dx: padding, dy: padding)
        let typeset = Typeset(text, font, color: color, maxWidth: box.width + 0.01)
        let scale = abs(context.userSpaceToDeviceSpaceTransform.d)
        let first = baseline(font, scale: scale), line = lineHeight(font, scale: scale)
        context.textMatrix = CGAffineTransform(scaleX: 1, y: -1)
        for (i, ctLine) in typeset.lines.enumerated() {
            let slack = box.width - typeset.widths[i]
            let x = box.minX + (alignment == .center ? slack / 2 : alignment == .right ? slack : 0)
            // The baseline lands on a device pixel, as the browser paints it.
            let device = context.convertToDeviceSpace(CGPoint(x: x, y: box.minY + CGFloat(i) * line + first))
            context.textPosition = context.convertToUserSpace(CGPoint(x: device.x, y: device.y.rounded()))
            CTLineDraw(ctLine, context)
        }
    }
}

#if os(iOS)
/// The iOS checkbox: a circle that fills with a check, as in Reminders. A 24-point box, a 44-point touch area.
final class CheckBox: UIButton {
    var isOn = false {
        didSet { setImage(UIImage(systemName: isOn ? "checkmark.circle.fill" : "circle"), for: .normal) }
    }

    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        bounds.insetBy(dx: -10, dy: -10).contains(point)
    }
}
#endif

@MainActor
final class Host: NSObject {
    let context = JSContext()!
    let root = Box()
    private var views: [Int: View] = [:]
    private var ids: [ObjectIdentifier: Int] = [:]
    private var fonts: [Int: (size: CGFloat, bold: Bool, system: Bool)] = [:]
    private var assets = ""
    private var rootSize = CGSize.zero
    /// Frames as JS sent them; views get them snapped to device pixels (snapFrames).
    private var layout: [Int: CGRect] = [:]
    private var placed = false

    // Navigation (Navigation.swift).
    var screens: [Int: ScreenController] = [:]
    var stacks: [Int: StackController] = [:]
    var tabs: [Int: TabsController] = [:]
    /// The body's background: every screen's background.
    var pageColor: Color?
    var window: Window?
    var rootTabs: TabsController?
    var rootStack: StackController?
    // Device data (Device.swift).
    var lastBattery = ""
    var batteryWatch: AnyObject?
    #if os(macOS)
    var chrome: Chrome?
    #endif

    func start(bundle path: String) {
        views[1] = root
        assets = (path as NSString).deletingLastPathComponent
        // The bundled font (fonts/ next to app.js): every host sets text in it.
        for name in ["Inter-Regular", "Inter-Bold"] {
            let url = URL(fileURLWithPath: "\(assets)/fonts/\(name).ttf")
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
        context.exceptionHandler = { _, error in print("JS error:", error?.toString() ?? "") }
        let receive: @convention(block) (String) -> Void = { [unowned self] json in
            let ops = try! JSONSerialization.jsonObject(with: Data(json.utf8)) as! [[Any]]
            for op in ops { self.apply(op) }
            if self.placed { self.snapFrames() }
            // Animate what changed in each stack, once per batch.
            for stack in self.stacks.values where stack.dirty { stack.sync() }
            self.updateChrome()
        }
        context.setObject(receive, forKeyedSubscript: "__nuclo_host" as NSString)
        let measure: @convention(block) (Int, Double) -> String = { [unowned self] id, maxWidth in
            let size = self.measure(id, CGFloat(maxWidth))
            return "\(size.width) \(size.height)"
        }
        context.setObject(measure, forKeyedSubscript: "__nuclo_measure" as NSString)
        let device: @convention(block) (String) -> String = { [unowned self] name in self.device(name) }
        context.setObject(device, forKeyedSubscript: "__nuclo_device" as NSString)
        context.evaluateScript(try! String(contentsOfFile: path, encoding: .utf8))
        // Without the router the body is the layout root: JS lays it out at the window's size.
        root.resized = { [unowned self] size in
            guard size != self.rootSize else { return }
            self.rootSize = size
            self.emit(id: 1, "resize", "\(size.width) \(size.height) \(deviceScale())")
        }
        root.resized?(root.bounds.size)
    }

    /// __nuclo_measure: a leaf's content size (layout.ts adds padding).
    private func measure(_ id: Int, _ maxWidth: CGFloat) -> CGSize {
        switch views[id] {
        case let text as TextView:
            return text.measure(maxWidth, scale: deviceScale())
        case let image as ImageView:
            return image.image?.size ?? .zero
        #if os(macOS)
        case let button as NSButton:
            let font = button.font ?? textFont()
            return Typeset(button.title, font, maxWidth: maxWidth).size(font, scale: deviceScale())
        #else
        case let button as UIButton:
            let font = button.titleLabel?.font ?? textFont()
            return Typeset(button.title(for: .normal) ?? "", font, maxWidth: maxWidth).size(font, scale: deviceScale())
        #endif
        default:
            return .zero
        }
    }

    /// Places views at their frames with edges on device pixels, as the browser paints boxes:
    /// each edge rounds from its unsnapped position on screen, so boxes never blur or gap.
    private func snapFrames() {
        placed = false
        let scale = deviceScale()
        let snap = { (v: CGFloat) in (v * scale).rounded() / scale }
        func place(_ parent: View, at origin: CGPoint, snapped: CGPoint) {
            for child in parent.subviews {
                guard let id = ids[ObjectIdentifier(child)], let frame = layout[id] else { continue }
                let x = origin.x + frame.minX, y = origin.y + frame.minY
                let edges = CGRect(x: snap(x), y: snap(y), width: 0, height: 0)
                child.frame = CGRect(
                    x: edges.minX - snapped.x, y: edges.minY - snapped.y,
                    width: snap(x + frame.width) - edges.minX, height: snap(y + frame.height) - edges.minY
                )
                (child as? TextView)?.layout = CGRect(x: x - edges.minX, y: y - edges.minY, width: frame.width, height: frame.height)
                place(child, at: CGPoint(x: x, y: y), snapped: edges.origin)
            }
        }
        for root in [root] + screens.values.map(\.content) { place(root, at: .zero, snapped: .zero) }
    }

    /// __nuclo_device("frames"): every view's frame as placed, relative to its parent (check.ts).
    func framesJSON() -> String {
        var frames: [String: [Double]] = [:]
        for (id, view) in views {
            // Layout roots are their own origin.
            let frame = id == 1 || screens[id] != nil ? CGRect(origin: .zero, size: view.frame.size) : view.frame
            frames[String(id)] = [frame.minX, frame.minY, frame.width, frame.height].map { (Double($0) * 100).rounded() / 100 }
        }
        return String(data: try! JSONSerialization.data(withJSONObject: frames), encoding: .utf8)!
    }

    private func emit(_ sender: AnyObject?, _ type: String, _ value: Any? = nil) {
        guard let sender, let id = ids[ObjectIdentifier(sender)] else { return }
        emit(id: id, type, value)
    }

    func emit(id: Int, _ type: String, _ value: Any? = nil) {
        let arguments: [Any] = value.map { [id, type, $0] } ?? [id, type]
        context.objectForKeyedSubscript("__nuclo_event").call(withArguments: arguments)
    }

    @objc private func clicked(_ sender: AnyObject) { emit(sender, "click") }
    @objc private func tapped(_ recognizer: Tap) { emit(recognizer.view, "click") }
    @objc private func committed(_ sender: AnyObject) { emit(sender, "change") }
    #if os(macOS)
    @objc private func toggled(_ sender: NSButton) { emit(sender, "change", sender.state == .on) }
    #else
    @objc private func toggled(_ sender: CheckBox) {
        sender.isOn.toggle()
        emit(sender, "change", sender.isOn)
    }
    @objc private func edited(_ sender: UITextField) { emit(sender, "input", sender.text ?? "") }
    #endif

    private func create(_ kind: String) -> View {
        switch kind {
        case "text":
            return TextView()
        case "button":
            #if os(macOS)
            // The push button that stretches to its box (layout.ts sizes it).
            let button = NSButton(title: "", target: self, action: #selector(clicked(_:)))
            button.bezelStyle = .flexiblePush
            #else
            let button = UIButton(type: .system)
            button.addTarget(self, action: #selector(clicked(_:)), for: .touchUpInside)
            button.titleLabel?.font = textFont()
            #endif
            #if os(macOS)
            button.font = textFont()
            #endif
            return button
        case "input":
            #if os(macOS)
            let field = Field()
            field.font = textFont()
            field.delegate = self
            field.target = self
            field.action = #selector(committed(_:))
            (field.cell as? NSTextFieldCell)?.sendsActionOnEndEditing = false
            return field
            #else
            let field = UITextField()
            field.borderStyle = .roundedRect
            field.font = textFont()
            field.addTarget(self, action: #selector(edited(_:)), for: .editingChanged)
            field.addTarget(self, action: #selector(committed(_:)), for: .editingDidEndOnExit)
            return field
            #endif
        case "checkbox":
            #if os(macOS)
            let box = NSButton(checkboxWithTitle: "", target: self, action: #selector(toggled(_:)))
            box.imagePosition = .imageOnly
            return box
            #else
            let box = CheckBox(type: .system)
            box.isOn = false
            box.setPreferredSymbolConfiguration(UIImage.SymbolConfiguration(pointSize: 21), forImageIn: .normal)
            box.addTarget(self, action: #selector(toggled(_:)), for: .touchUpInside)
            return box
            #endif
        case "image":
            let image = ImageView()
            #if os(iOS)
            image.contentMode = .scaleAspectFill
            image.clipsToBounds = true
            #endif
            return image
        default:
            return Box()
        }
    }

    private func apply(_ op: [Any]) {
        let id = op[1] as! Int
        switch op[0] as! String {
        case "create":
            switch op[2] as! String {
            case "screen":
                let screen = ScreenController(id: id, host: self)
                screens[id] = screen
                views[id] = screen.content
                ids[ObjectIdentifier(screen.content)] = id
            case "stack": stacks[id] = StackController(id: id, host: self)
            case "tabs": tabs[id] = TabsController(id: id, host: self)
            default:
                let view = create(op[2] as! String)
                views[id] = view
                ids[ObjectIdentifier(view)] = id
            }

        case "insert":
            let childId = op[2] as! Int
            if let stack = stacks[id], let screen = screens[childId] {
                stack.insert(screen, before: screens[op[3] as! Int])
                break
            }
            if let tabs = tabs[id], let stack = stacks[childId] {
                tabs.add(stack)
                break
            }
            if id == 1, let navigation = tabs[childId]?.controller ?? stacks[childId]?.controller {
                rootTabs = tabs[childId]
                rootStack = stacks[childId]
                setRoot(navigation)
                break
            }
            let parent = views[id]!
            let child = views[childId]!
            child.removeFromSuperview()
            if let before = views[op[3] as! Int] {
                #if os(macOS)
                parent.addSubview(child, positioned: .below, relativeTo: before)
                #else
                parent.insertSubview(child, belowSubview: before)
                #endif
            } else {
                parent.addSubview(child)
            }

        case "remove":
            if let screen = screens.removeValue(forKey: id) {
                // The stack lets it go at the end of the batch, animated.
                for stack in stacks.values { stack.remove(screen) }
                forget(screen.content)
                break
            }
            if stacks.removeValue(forKey: id) != nil || tabs.removeValue(forKey: id) != nil { break }
            let view = views[id]!
            view.removeFromSuperview()
            forget(view)

        case "set":
            let key = op[2] as! String
            let text = op[3] as? String ?? ""
            if let screen = screens[id] {
                if key == "title" { screen.title = text }
            } else if let stack = stacks[id] {
                stack.setTab(key, text)
            } else if let tabs = tabs[id] {
                if key == "selected" { tabs.select(Int(text) ?? 0) }
            } else {
                set(views[id]!, key, op[3])
            }

        case "style":
            guard let view = views[id] else { break }
            style(id, view, op[2] as! String, op[3] as! String)

        case "frame":
            let n = op[2...].map { CGFloat(($0 as! NSNumber).doubleValue) }
            let frame = CGRect(x: n[0], y: n[1], width: n[2], height: n[3])
            if let screen = screens[id] {
                screen.setContent(frame.size)
            } else if id != 1 {
                layout[id] = frame
                placed = true
            }

        case "listen":
            // Buttons and inputs always report; anything else needs a recognizer.
            guard let view = views[id] else { break }
            if op[2] as! String == "click", !(view is Control) {
                view.addGestureRecognizer(Tap(target: self, action: #selector(tapped(_:))))
                #if os(iOS)
                (view as? Box)?.pressable = true
                #endif
            }

        default:
            break
        }
    }

    private func forget(_ view: View) {
        if view is Box { view.subviews.forEach(forget) }
        guard let id = ids.removeValue(forKey: ObjectIdentifier(view)) else { return }
        views[id] = nil
        fonts[id] = nil
        layout[id] = nil
    }

    private func set(_ view: View, _ key: String, _ value: Any) {
        let text = value as? String ?? ""
        switch key {
        case "text":
            #if os(macOS)
            if let button = view as? NSButton { button.title = text }
            #else
            if let button = view as? UIButton { button.setTitle(text, for: .normal) }
            #endif
            (view as? TextView)?.text = text
        case "value":
            #if os(macOS)
            (view as? NSTextField)?.text = text
            #else
            (view as? UITextField)?.text = text
            #endif
        case "placeholder":
            #if os(macOS)
            (view as? NSTextField)?.placeholder = text
            #else
            (view as? UITextField)?.placeholder = text
            #endif
        case "checked":
            let on = (value as? Bool) == true
            #if os(macOS)
            (view as? NSButton)?.state = on ? .on : .off
            #else
            (view as? CheckBox)?.isOn = on
            #endif
        case "src":
            // Asset paths are relative to the bundle.
            let file = (assets as NSString).appendingPathComponent(text)
            #if os(macOS)
            (view as? ImageView)?.image = NSImage(contentsOfFile: file)
            #else
            (view as? UIImageView)?.image = UIImage(contentsOfFile: file)
            #endif
        case "disabled":
            (view as? Control)?.isEnabled = (value as? Bool) != true
        default:
            break
        }
    }

    /// Paint and text styles. Layout styles (flexDirection, gap, alignItems, flex, width,
    /// height, padding) are JS's: they arrive as frames.
    private func style(_ id: Int, _ view: View, _ key: String, _ value: String) {
        switch key {
        case "padding": (view as? TextView)?.padding = px(value)
        case "opacity":
            #if os(iOS)
            if let box = view as? Box { box.restAlpha = px(value); break }
            #endif
            view.alpha = px(value)
        case "borderRadius":
            #if os(macOS)
            view.wantsLayer = true
            view.layer?.cornerRadius = px(value)
            view.layer?.masksToBounds = true
            #else
            view.layer.cornerRadius = px(value)
            view.layer.masksToBounds = true
            #endif
        case "textAlign":
            (view as? TextView)?.alignment = value == "center" ? .center : value == "right" ? .right : .left
        case "backgroundColor":
            if id == 1 {
                pageColor = color(value)
                for screen in screens.values { screen.applyBackground() }
            }
            #if os(macOS)
            view.wantsLayer = true
            view.layer?.backgroundColor = color(value).cgColor
            #else
            view.backgroundColor = color(value)
            #endif
        case "color":
            (view as? TextView)?.color = color(value)
            #if os(macOS)
            (view as? NSTextField)?.textColor = color(value)
            #else
            (view as? UITextField)?.textColor = color(value)
            (view as? UIButton)?.setTitleColor(color(value), for: .normal)
            #endif
        case "fontSize", "fontWeight", "fontFamily":
            var spec = fonts[id] ?? (14, false, false)
            switch key {
            case "fontSize": spec.size = px(value)
            case "fontWeight": spec.bold = value == "bold" || (Int(value) ?? 400) >= 600
            default: spec.system = value == "system"
            }
            fonts[id] = spec
            let resolved = textFont(size: spec.size, bold: spec.bold, system: spec.system)
            (view as? TextView)?.font = resolved
            #if os(macOS)
            (view as? NSControl)?.font = resolved
            #else
            (view as? UITextField)?.font = resolved
            (view as? UIButton)?.titleLabel?.font = resolved
            #endif
        default:
            break
        }
    }
}

let host = Host()

#if os(macOS)
extension Host: NSTextFieldDelegate, NSApplicationDelegate {
    func controlTextDidChange(_ notification: Notification) {
        let field = notification.object as? NSTextField
        emit(field, "input", field?.stringValue ?? "")
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
app.delegate = host
app.mainMenu = mainMenu(host)
let window = NSWindow(
    contentRect: NSRect(x: 0, y: 0, width: 420, height: 640),
    styleMask: [.titled, .closable, .miniaturizable, .resizable],
    backing: .buffered,
    defer: false
)
window.title = "nuclo-native"
window.contentView = host.root
host.window = window
host.start(bundle: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "dist/app.js")
window.center()
window.makeKeyAndOrderFront(nil)
app.activate(ignoringOtherApps: true)
app.run()
#else
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        host.window = window
        let controller = UIViewController()
        window?.rootViewController = controller
        controller.view.backgroundColor = .systemBackground
        controller.view.addSubview(host.root)
        host.root.translatesAutoresizingMaskIntoConstraints = false
        let safe = controller.view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            host.root.topAnchor.constraint(equalTo: safe.topAnchor),
            host.root.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            host.root.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            host.root.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
        ])
        // A router outlet in the body replaces this controller (Host.setRoot).
        host.start(bundle: Bundle.main.path(forResource: "app", ofType: "js")!)
        window?.makeKeyAndVisible()
        return true
    }
}

UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(AppDelegate.self))
#endif
