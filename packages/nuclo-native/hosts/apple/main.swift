// nuclo-native host for macOS and iOS: AppKit / UIKit views driven by JavaScriptCore.
//
// macOS: swiftc hosts/apple/main.swift -o dist/nuclo-app && dist/nuclo-app dist/app.js
// iOS:   add this file and dist/app.js to an iOS app target (no storyboard, no scene manifest).
import JavaScriptCore

#if os(macOS)
import AppKit
typealias View = NSView
typealias Control = NSControl
typealias Color = NSColor
typealias Font = NSFont
typealias ImageView = NSImageView
typealias Tap = NSClickGestureRecognizer

extension NSView {
    var alpha: CGFloat { get { alphaValue } set { alphaValue = newValue } }
}
extension NSTextField {
    var text: String? { get { stringValue } set { stringValue = newValue ?? "" } }
    var placeholder: String? { get { placeholderString } set { placeholderString = newValue } }
}
#else
import UIKit
typealias View = UIView
typealias Control = UIControl
typealias Color = UIColor
typealias Font = UIFont
typealias ImageView = UIImageView
typealias Tap = UITapGestureRecognizer
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

/// A flex container: direction, gap, padding, alignItems, and per-child flex grow and fixed sizes.
final class FlexView: View {
    static var grow: [ObjectIdentifier: CGFloat] = [:]
    static var widths: [ObjectIdentifier: CGFloat] = [:]
    static var heights: [ObjectIdentifier: CGFloat] = [:]
    var row = false
    var gap: CGFloat = 0
    var padding: CGFloat = 0
    var align = "stretch"

    #if os(macOS)
    override var isFlipped: Bool { true }
    override func layout() {
        super.layout()
        arrange()
    }
    #else
    override func layoutSubviews() {
        super.layoutSubviews()
        arrange()
    }
    #endif

    private var gaps: CGFloat { gap * CGFloat(max(subviews.count - 1, 0)) }

    static func measure(_ view: View) -> CGSize {
        var size = natural(view)
        if let width = widths[ObjectIdentifier(view)] { size.width = width }
        if let height = heights[ObjectIdentifier(view)] { size.height = height }
        return size
    }

    private static func natural(_ view: View) -> CGSize {
        // An image takes the box it is given, never its pixel size.
        if view is ImageView { return .zero }
        guard let box = view as? FlexView else {
            let size = view.intrinsicContentSize
            return CGSize(width: max(size.width, 0), height: max(size.height, 0))
        }
        var main = box.gaps + box.padding * 2
        var cross: CGFloat = 0
        for child in box.subviews {
            let size = measure(child)
            main += box.row ? size.width : size.height
            cross = max(cross, box.row ? size.height : size.width)
        }
        cross += box.padding * 2
        return box.row ? CGSize(width: main, height: cross) : CGSize(width: cross, height: main)
    }

    private func arrange() {
        let inner = bounds.insetBy(dx: padding, dy: padding)
        let sizes = subviews.map(FlexView.measure)
        let grows = subviews.map { FlexView.grow[ObjectIdentifier($0)] ?? 0 }
        let mainTotal = row ? inner.width : inner.height
        let crossTotal = row ? inner.height : inner.width
        let used = sizes.reduce(gaps) { $0 + (row ? $1.width : $1.height) }
        let free = max(mainTotal - used, 0)
        let grow = grows.reduce(0, +)
        var position = row ? inner.minX : inner.minY

        for (i, child) in subviews.enumerated() {
            let main = (row ? sizes[i].width : sizes[i].height) + (grow > 0 ? free * grows[i] / grow : 0)
            let cross = align == "stretch" ? crossTotal : min(row ? sizes[i].height : sizes[i].width, crossTotal)
            let slack = crossTotal - cross
            let offset = (row ? inner.minY : inner.minX) + (align == "center" ? slack / 2 : align == "flex-end" ? slack : 0)
            child.frame = row
                ? CGRect(x: position, y: offset, width: main, height: cross)
                : CGRect(x: offset, y: position, width: cross, height: main)
            position += main + gap
        }
    }

    /// Text or structure changed somewhere: every container re-arranges.
    func invalidate() {
        #if os(macOS)
        needsLayout = true
        #else
        setNeedsLayout()
        #endif
        for case let child as FlexView in subviews { child.invalidate() }
    }
}

@MainActor
final class Host: NSObject {
    let context = JSContext()!
    let root = FlexView()
    private var views: [Int: View] = [:]
    private var ids: [ObjectIdentifier: Int] = [:]
    private var fonts: [Int: (size: CGFloat, bold: Bool)] = [:]
    private var assets = ""

    func start(bundle path: String) {
        views[1] = root
        assets = (path as NSString).deletingLastPathComponent
        context.exceptionHandler = { _, error in print("JS error:", error?.toString() ?? "") }
        let receive: @convention(block) (String) -> Void = { [unowned self] json in
            let ops = try! JSONSerialization.jsonObject(with: Data(json.utf8)) as! [[Any]]
            for op in ops { self.apply(op) }
            self.root.invalidate()
        }
        context.setObject(receive, forKeyedSubscript: "__nuclo_host" as NSString)
        context.evaluateScript(try! String(contentsOfFile: path, encoding: .utf8))
    }

    private func emit(_ sender: AnyObject?, _ type: String, _ value: Any? = nil) {
        guard let sender, let id = ids[ObjectIdentifier(sender)] else { return }
        let arguments: [Any] = value.map { [id, type, $0] } ?? [id, type]
        context.objectForKeyedSubscript("__nuclo_event").call(withArguments: arguments)
    }

    @objc private func clicked(_ sender: AnyObject) { emit(sender, "click") }
    @objc private func tapped(_ recognizer: Tap) { emit(recognizer.view, "click") }
    @objc private func committed(_ sender: AnyObject) { emit(sender, "change") }
    #if os(macOS)
    @objc private func toggled(_ sender: NSButton) { emit(sender, "change", sender.state == .on) }
    #else
    @objc private func toggled(_ sender: UISwitch) { emit(sender, "change", sender.isOn) }
    @objc private func edited(_ sender: UITextField) { emit(sender, "input", sender.text ?? "") }
    #endif

    private func create(_ kind: String) -> View {
        switch kind {
        case "text":
            #if os(macOS)
            return NSTextField(labelWithString: "")
            #else
            return UILabel()
            #endif
        case "button":
            #if os(macOS)
            return NSButton(title: "", target: self, action: #selector(clicked(_:)))
            #else
            let button = UIButton(type: .system)
            button.addTarget(self, action: #selector(clicked(_:)), for: .touchUpInside)
            return button
            #endif
        case "input":
            #if os(macOS)
            let field = NSTextField()
            field.delegate = self
            field.target = self
            field.action = #selector(committed(_:))
            (field.cell as? NSTextFieldCell)?.sendsActionOnEndEditing = false
            return field
            #else
            let field = UITextField()
            field.borderStyle = .roundedRect
            field.addTarget(self, action: #selector(edited(_:)), for: .editingChanged)
            field.addTarget(self, action: #selector(committed(_:)), for: .editingDidEndOnExit)
            return field
            #endif
        case "checkbox":
            #if os(macOS)
            return NSButton(checkboxWithTitle: "", target: self, action: #selector(toggled(_:)))
            #else
            let toggle = UISwitch()
            toggle.addTarget(self, action: #selector(toggled(_:)), for: .valueChanged)
            return toggle
            #endif
        case "image":
            let image = ImageView()
            #if os(macOS)
            image.imageScaling = .scaleProportionallyUpOrDown
            #else
            image.contentMode = .scaleAspectFill
            image.clipsToBounds = true
            #endif
            return image
        default:
            return FlexView()
        }
    }

    private func apply(_ op: [Any]) {
        let id = op[1] as! Int
        switch op[0] as! String {
        case "create":
            let view = create(op[2] as! String)
            views[id] = view
            ids[ObjectIdentifier(view)] = id

        case "insert":
            let parent = views[id]!
            let child = views[op[2] as! Int]!
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
            let view = views[id]!
            view.removeFromSuperview()
            forget(view)

        case "set":
            set(views[id]!, op[2] as! String, op[3])

        case "style":
            style(id, views[id]!, op[2] as! String, op[3] as! String)

        case "listen":
            // Buttons and inputs always report; anything else needs a recognizer.
            let view = views[id]!
            if op[2] as! String == "click", !(view is Control) {
                view.addGestureRecognizer(Tap(target: self, action: #selector(tapped(_:))))
            }

        default:
            break
        }
    }

    private func forget(_ view: View) {
        if view is FlexView { view.subviews.forEach(forget) }
        guard let id = ids.removeValue(forKey: ObjectIdentifier(view)) else { return }
        views[id] = nil
        fonts[id] = nil
        FlexView.grow[ObjectIdentifier(view)] = nil
        FlexView.widths[ObjectIdentifier(view)] = nil
        FlexView.heights[ObjectIdentifier(view)] = nil
    }

    private func set(_ view: View, _ key: String, _ value: Any) {
        let text = value as? String ?? ""
        switch key {
        case "text":
            #if os(macOS)
            if view is ImageView { break }
            if let button = view as? NSButton { button.title = text } else { (view as? NSTextField)?.text = text }
            #else
            if let button = view as? UIButton { button.setTitle(text, for: .normal) } else { (view as? UILabel)?.text = text }
            #endif
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
            (view as? UISwitch)?.isOn = on
            #endif
        case "src":
            // Asset paths are relative to the bundle.
            let file = (assets as NSString).appendingPathComponent(text)
            #if os(macOS)
            (view as? NSImageView)?.image = NSImage(contentsOfFile: file)
            #else
            (view as? UIImageView)?.image = UIImage(contentsOfFile: file)
            #endif
        case "disabled":
            (view as? Control)?.isEnabled = (value as? Bool) != true
        default:
            break
        }
    }

    private func style(_ id: Int, _ view: View, _ key: String, _ value: String) {
        let box = view as? FlexView
        switch key {
        case "flexDirection": box?.row = value == "row"
        case "gap": box?.gap = px(value)
        case "padding": box?.padding = px(value)
        case "alignItems": box?.align = value
        case "flex": FlexView.grow[ObjectIdentifier(view)] = px(value)
        case "opacity": view.alpha = px(value)
        case "width": FlexView.widths[ObjectIdentifier(view)] = px(value)
        case "height": FlexView.heights[ObjectIdentifier(view)] = px(value)
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
            #if os(macOS)
            (view as? NSTextField)?.alignment = value == "center" ? .center : .left
            #else
            (view as? UILabel)?.textAlignment = value == "center" ? .center : .left
            #endif
        case "backgroundColor":
            #if os(macOS)
            view.wantsLayer = true
            view.layer?.backgroundColor = color(value).cgColor
            #else
            view.backgroundColor = color(value)
            #endif
        case "color":
            #if os(macOS)
            (view as? NSTextField)?.textColor = color(value)
            #else
            (view as? UILabel)?.textColor = color(value)
            #endif
        case "fontSize", "fontWeight":
            var font = fonts[id] ?? (Font.systemFontSize, false)
            if key == "fontSize" { font.size = px(value) } else { font.bold = value == "bold" }
            fonts[id] = font
            let resolved = Font.systemFont(ofSize: font.size, weight: font.bold ? .bold : .regular)
            #if os(macOS)
            (view as? NSTextField)?.font = resolved
            #else
            (view as? UILabel)?.font = resolved
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
let window = NSWindow(
    contentRect: NSRect(x: 0, y: 0, width: 420, height: 640),
    styleMask: [.titled, .closable, .miniaturizable, .resizable],
    backing: .buffered,
    defer: false
)
window.title = "nuclo-native"
window.contentView = host.root
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
        let controller = UIViewController()
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
        host.start(bundle: Bundle.main.path(forResource: "app", ofType: "js")!)

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = controller
        window?.makeKeyAndVisible()
        return true
    }
}

UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(AppDelegate.self))
#endif
