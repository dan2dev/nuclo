// The iOS side of examples/platform-views, compiled with the generated App.swift (WebViewProps and DatePickerProps
// are the compiler's classes for the app's interfaces).

import UIKit
import WebKit

@MainActor final class WebView: NativeComponent {
    typealias Props = WebViewProps

    /// Holds the props the page's title is reported to, and is the web view's navigation delegate.
    private final class Pager: NSObject, WKNavigationDelegate {
        var props: WebViewProps?
        var url = ""

        func webView(_ view: WKWebView, didFinish navigation: WKNavigation!) {
            MainActor.assumeIsolated { props?.onLoad(view.title ?? "") }
        }
    }

    private let pager = Pager()

    func create() -> UIView {
        let view = WKWebView()
        view.navigationDelegate = pager
        return view
    }

    func update(_ view: UIView, _ props: WebViewProps) {
        pager.props = props
        guard props.url != pager.url, let url = URL(string: props.url), let web = view as? WKWebView else { return }
        pager.url = props.url
        web.load(URLRequest(url: url))
    }
}

@MainActor final class DatePicker: NativeComponent {
    typealias Props = DatePickerProps

    private var props: DatePickerProps?

    func create() -> UIView {
        let picker = UIDatePicker()
        picker.datePickerMode = .date
        picker.preferredDatePickerStyle = .compact
        picker.contentHorizontalAlignment = .trailing
        picker.addAction(UIAction { [weak self, weak picker] _ in
            guard let picker else { return }
            self?.props?.onChange(isoDay.string(from: picker.date))
        }, for: .valueChanged)
        return picker
    }

    func update(_ view: UIView, _ props: DatePickerProps) {
        self.props = props
        guard let picker = view as? UIDatePicker, let date = isoDay.date(from: props.value) else { return }
        if isoDay.string(from: picker.date) != props.value { picker.date = date }
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

@MainActor func share(_ text: String) async throws -> String {
    guard let top = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first else { return "Not shared" }
    var shown = top
    while let next = shown.presentedViewController { shown = next }
    let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
    // An iPad shows the sheet as a popover, which needs a place to point at.
    sheet.popoverPresentationController?.sourceView = shown.view
    sheet.popoverPresentationController?.sourceRect = CGRect(x: shown.view.bounds.midX, y: shown.view.bounds.midY, width: 0, height: 0)
    return await withCheckedContinuation { continuation in
        sheet.completionWithItemsHandler = { _, completed, _, _ in continuation.resume(returning: completed ? "Shared" : "Not shared") }
        shown.present(sheet, animated: true)
    }
}
