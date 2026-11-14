#if os(macOS)
import AppKit

final class MultilineField: NSScrollView, NSTextViewDelegate {
    let editor = NSTextView()
    private let hint = NSTextField(labelWithString: "")
    var report: ((String, String) -> Void)?
    private var edited = false
    var value: String {
        get { editor.string }
        set {
            if editor.string != newValue { editor.string = newValue }
            refreshHint()
        }
    }
    var placeholder: String {
        get { hint.stringValue }
        set { hint.stringValue = newValue; needsLayout = true }
    }
    var insets = Edges.zero { didSet { needsLayout = true } }
    var font = textFont() { didSet { editor.font = font; hint.font = font; needsLayout = true } }
    var textColor: NSColor { get { editor.textColor ?? .labelColor } set { editor.textColor = newValue } }
    var isEditable: Bool { get { editor.isEditable } set { editor.isEditable = newValue } }

    override init(frame: NSRect) {
        super.init(frame: frame)
        drawsBackground = false
        hasVerticalScroller = true
        editor.isRichText = false
        editor.drawsBackground = false
        editor.allowsUndo = true
        editor.font = font
        editor.delegate = self
        editor.isVerticallyResizable = true
        editor.autoresizingMask = .width
        editor.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        editor.textContainer?.widthTracksTextView = true
        editor.textContainer?.lineFragmentPadding = 0
        documentView = editor
        hint.textColor = .placeholderTextColor
        hint.font = font
        hint.setAccessibilityHidden(true)
        editor.addSubview(hint)
    }

    required init?(coder: NSCoder) { nil }

    override func layout() {
        super.layout()
        let size = NSSize(width: contentSize.width, height: max(contentSize.height, editor.frame.height))
        if editor.frame.size != size { editor.setFrameSize(size) }
        editor.textContainerInset = NSSize(width: insets.left, height: insets.top)
        hint.frame = NSRect(x: insets.left, y: insets.top, width: max(0, editor.bounds.width - insets.left - insets.right), height: hint.intrinsicContentSize.height)
    }

    private func refreshHint() { hint.isHidden = !editor.string.isEmpty }
    func textDidChange(_ notification: Notification) {
        edited = true
        refreshHint()
        report?("input", editor.string)
    }
    func textDidEndEditing(_ notification: Notification) {
        if edited { report?("change", editor.string) }
        edited = false
    }
}
#else
import UIKit

final class MultilineField: UITextView, UITextViewDelegate {
    private let hint = UILabel()
    var report: ((String, String) -> Void)?
    private var edited = false
    var value: String {
        get { text }
        set {
            if text != newValue { text = newValue }
            refreshHint()
        }
    }
    var placeholder: String {
        get { hint.text ?? "" }
        set { hint.text = newValue; setNeedsLayout() }
    }
    var insets = Edges.zero {
        didSet { textContainerInset = UIEdgeInsets(top: insets.top, left: insets.left, bottom: insets.bottom, right: insets.right) }
    }
    override var font: UIFont? { didSet { hint.font = font; setNeedsLayout() } }

    init() {
        super.init(frame: .zero, textContainer: nil)
        font = textFont()
        delegate = self
        textContainer.lineFragmentPadding = 0
        hint.textColor = .placeholderText
        hint.isAccessibilityElement = false
        addSubview(hint)
    }

    required init?(coder: NSCoder) { nil }

    override func layoutSubviews() {
        super.layoutSubviews()
        hint.frame = CGRect(x: insets.left, y: insets.top, width: max(0, bounds.width - insets.left - insets.right), height: hint.intrinsicContentSize.height)
    }

    private func refreshHint() { hint.isHidden = !text.isEmpty }
    func textViewDidChange(_ textView: UITextView) {
        edited = true
        refreshHint()
        report?("input", text)
    }
    func textViewDidEndEditing(_ textView: UITextView) {
        if edited { report?("change", text) }
        edited = false
    }
}
#endif
