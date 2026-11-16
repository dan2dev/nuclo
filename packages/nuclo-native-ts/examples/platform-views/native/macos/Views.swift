// The macOS side of examples/platform-views, compiled with the generated App.swift (WebViewProps and DatePickerProps
// are the compiler's classes for the app's interfaces). UIView is the runtime's AppKit shim.

import AppKit
import WebKit

@MainActor final class WebView: NativeComponent {
    typealias Props = WebViewProps

    private final class Host: UIView, WKNavigationDelegate {
        let web = WKWebView()
        var props: WebViewProps?
        var url = ""

        override init(frame: CGRect) {
            super.init(frame: frame)
            web.navigationDelegate = self
            addSubview(web)
        }

        required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

        override func layoutSubviews() {
            super.layoutSubviews()
            web.frame = bounds
        }

        // The page takes the mouse and the wheel.
        override var nativeHit: NSView? { web }

        func webView(_ view: WKWebView, didFinish navigation: WKNavigation!) {
            props?.onLoad(view.title ?? "")
        }
    }

    func create() -> UIView { Host() }

    func update(_ view: UIView, _ props: WebViewProps) {
        guard let host = view as? Host else { return }
        host.props = props
        guard props.url != host.url, let url = URL(string: props.url) else { return }
        host.url = props.url
        host.web.load(URLRequest(url: url))
    }
}

@MainActor final class DatePicker: NativeComponent {
    typealias Props = DatePickerProps

    private var props: DatePickerProps?

    /// The field-and-stepper NSDatePicker, which opens a calendar when clicked, centred in a box the layout sizes.
    private final class Host: UIView {
        let picker = NSDatePicker()

        override init(frame: CGRect) {
            super.init(frame: frame)
            picker.datePickerElements = .yearMonthDay
            picker.datePickerStyle = .textFieldAndStepper
            picker.presentsCalendarOverlay = true
            picker.sizeToFit()
            addSubview(picker)
        }

        required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

        override func layoutSubviews() {
            super.layoutSubviews()
            let size = picker.fittingSize
            picker.frame = CGRect(x: bounds.width - size.width, y: (bounds.height - size.height) / 2, width: size.width, height: size.height)
        }

        override var nativeHit: NSView? { picker }
    }

    func create() -> UIView {
        let host = Host()
        host.picker.target = self
        host.picker.action = #selector(changed(_:))
        return host
    }

    @objc private func changed(_ picker: NSDatePicker) {
        props?.onChange(isoDay.string(from: picker.dateValue))
    }

    func update(_ view: UIView, _ props: DatePickerProps) {
        self.props = props
        guard let picker = (view as? Host)?.picker, let date = isoDay.date(from: props.value) else { return }
        if isoDay.string(from: picker.dateValue) != props.value { picker.dateValue = date }
    }
}

/// YYYY-MM-DD in the device's time zone.
@MainActor private let isoDay: DateFormatter = {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f
}()

@MainActor func daysUntil(_ date: String) -> Int {
    guard let day = isoDay.date(from: date) else { return 0 }
    let calendar = Calendar.current
    return calendar.dateComponents([.day], from: calendar.startOfDay(for: Date()), to: calendar.startOfDay(for: day)).day ?? 0
}

/// The share picker's answer: which service was chosen, if any.
private final class Sharing: NSObject, NSSharingServicePickerDelegate {
    var done: ((Bool) -> Void)?

    func sharingServicePicker(_ picker: NSSharingServicePicker, didChoose service: NSSharingService?) {
        done?(service != nil)
        done = nil
    }
}

@MainActor private var sharing: Sharing?

@MainActor func share(_ text: String) async throws -> String {
    guard let view = NSApp.keyWindow?.contentView ?? NSApp.windows.first?.contentView else { return "Not shared" }
    let picker = NSSharingServicePicker(items: [text])
    let delegate = Sharing()
    sharing = delegate
    picker.delegate = delegate
    // Shown from the pointer, where the click that asked for it was.
    let at = view.convert(view.window?.mouseLocationOutsideOfEventStream ?? .zero, from: nil)
    return await withCheckedContinuation { continuation in
        delegate.done = { continuation.resume(returning: $0 ? "Shared" : "Not shared") }
        picker.show(relativeTo: CGRect(origin: at, size: CGSize(width: 1, height: 1)), of: view, preferredEdge: .minY)
    }
}
