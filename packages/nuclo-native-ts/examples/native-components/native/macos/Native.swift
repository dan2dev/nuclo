// The macOS side of examples/native-components. It is compiled with the generated App.swift, in its
// module: SliderProps and GaugeProps are the classes the compiler made from the app's interfaces.
// UIView here is the runtime's AppKit shim (runtimes/macos/UIKitShim.swift).

import AppKit

@MainActor final class Slider: NativeComponent {
    typealias Props = SliderProps

    private var props: SliderProps?

    /// An NSSlider (0...1), centred in a view the layout sizes.
    private final class Host: UIView {
        let slider = NSSlider(value: 0, minValue: 0, maxValue: 1, target: nil, action: nil)
        override init(frame: CGRect) {
            super.init(frame: frame)
            addSubview(slider)
        }
        required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }
        override func layoutSubviews() {
            super.layoutSubviews()
            slider.frame = CGRect(x: 0, y: (bounds.height - 28) / 2, width: bounds.width, height: 28)
        }
        override func sizeThatFits(_ size: CGSize) -> CGSize { CGSize(width: size.width, height: 31) }
        override var nativeHit: NSView? { slider }
    }

    func create() -> UIView {
        let host = Host()
        host.slider.target = self
        host.slider.action = #selector(changed(_:))
        return host
    }

    @objc private func changed(_ slider: NSSlider) {
        guard let p = props else { return }
        p.onChange(p.min + (p.max - p.min) * slider.doubleValue)
    }

    func update(_ view: UIView, _ props: SliderProps) {
        self.props = props
        guard let host = view as? Host else { return }
        let value = (props.value - props.min) / (props.max - props.min)
        if host.slider.doubleValue != value { host.slider.doubleValue = value }
        if let tint = props.tint { host.slider.trackFillColor = hexColor(tint) }
    }
}

@MainActor final class Gauge: NativeComponent {
    typealias Props = GaugeProps

    private final class Ring: UIView {
        var props: GaugeProps? { didSet { needsDisplay = true } }

        override func draw(_ rect: NSRect) {
            guard let p = props else { return }
            let stroke = CGFloat(p.thickness)
            let center = CGPoint(x: bounds.midX, y: bounds.midY)
            let radius = (min(bounds.width, bounds.height) - stroke) / 2
            // The view is flipped (y down), so "clockwise" as drawn is NSBezierPath's counter-clockwise.
            let track = NSBezierPath()
            track.appendArc(withCenter: center, radius: radius, startAngle: 0, endAngle: 360)
            track.lineWidth = stroke
            hexColor("#e2e8f0").setStroke()
            track.stroke()
            let progress = min(1, max(0, p.progress))
            let arc = NSBezierPath()
            arc.appendArc(withCenter: center, radius: radius, startAngle: -90, endAngle: -90 + 360 * progress, clockwise: false)
            arc.lineWidth = stroke
            arc.lineCapStyle = .round
            hexColor(p.color).setStroke()
            arc.stroke()
        }
    }

    func create() -> UIView { Ring() }

    func update(_ view: UIView, _ props: GaugeProps) {
        (view as? Ring)?.props = props
    }
}

/// `#rrggbb`, as the app writes its colours.
private func hexColor(_ hex: String) -> NSColor {
    let n = UInt32(hex.dropFirst(), radix: 16) ?? 0
    return NSColor(
        srgbRed: CGFloat((n >> 16) & 0xff) / 255, green: CGFloat((n >> 8) & 0xff) / 255, blue: CGFloat(n & 0xff) / 255, alpha: 1
    )
}

@MainActor func platformName() -> String { "macOS \(ProcessInfo.processInfo.operatingSystemVersionString)" }

@MainActor func vibrate(_ milliseconds: Int) {
    // A Mac has no vibration: the trackpad's haptic tap stands in for it.
    NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .now)
}

@MainActor func batteryLevel() async throws -> Double {
    // -1 where there is no battery to read; IOKit's power sources are not linked here.
    -1
}
