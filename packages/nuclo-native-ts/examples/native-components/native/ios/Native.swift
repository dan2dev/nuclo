// The iOS side of examples/native-components. It is compiled with the generated App.swift, in its
// module: SliderProps and GaugeProps are the classes the compiler made from the app's interfaces.

import UIKit

@MainActor final class Slider: NativeComponent {
    typealias Props = SliderProps

    private var props: SliderProps?

    func create() -> UIView {
        let slider = UISlider()
        slider.addAction(
            UIAction { [weak self, weak slider] _ in
                guard let p = self?.props, let slider else { return }
                p.onChange(p.min + (p.max - p.min) * Double(slider.value))
            },
            for: .valueChanged
        )
        return slider
    }

    func update(_ view: UIView, _ props: SliderProps) {
        self.props = props
        guard let slider = view as? UISlider else { return }
        let value = Float((props.value - props.min) / (props.max - props.min))
        if slider.value != value { slider.value = value }
        if let tint = props.tint { slider.minimumTrackTintColor = hexColor(tint) }
    }
}

@MainActor final class Gauge: NativeComponent {
    typealias Props = GaugeProps

    private final class Ring: UIView {
        var props: GaugeProps?

        override init(frame: CGRect) {
            super.init(frame: frame)
            isOpaque = false
            // The ring is drawn for the view's size: a new size draws it again.
            contentMode = .redraw
        }

        required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

        override func draw(_ rect: CGRect) {
            guard let p = props else { return }
            let stroke = CGFloat(p.thickness)
            let center = CGPoint(x: bounds.midX, y: bounds.midY)
            let radius = (min(bounds.width, bounds.height) - stroke) / 2
            let track = UIBezierPath(arcCenter: center, radius: radius, startAngle: 0, endAngle: 2 * .pi, clockwise: true)
            track.lineWidth = stroke
            hexColor("#e2e8f0").setStroke()
            track.stroke()
            let progress = CGFloat(min(1, max(0, p.progress)))
            let top = -CGFloat.pi / 2
            let arc = UIBezierPath(arcCenter: center, radius: radius, startAngle: top, endAngle: top + 2 * .pi * progress, clockwise: true)
            arc.lineWidth = stroke
            arc.lineCapStyle = .round
            hexColor(p.color).setStroke()
            arc.stroke()
        }
    }

    func create() -> UIView { Ring() }

    func update(_ view: UIView, _ props: GaugeProps) {
        (view as? Ring)?.props = props
        view.setNeedsDisplay()
    }
}

/// `#rrggbb`, as the app writes its colours.
private func hexColor(_ hex: String) -> UIColor {
    let n = UInt32(hex.dropFirst(), radix: 16) ?? 0
    return UIColor(
        red: CGFloat((n >> 16) & 0xff) / 255, green: CGFloat((n >> 8) & 0xff) / 255, blue: CGFloat(n & 0xff) / 255, alpha: 1
    )
}

@MainActor func platformName() -> String { "iOS \(UIDevice.current.systemVersion)" }

@MainActor func vibrate(_ milliseconds: Int) {
    // iOS has no vibration of a given length for apps: `milliseconds` picks the weight of a haptic tap.
    UIImpactFeedbackGenerator(style: milliseconds > 30 ? .heavy : .light).impactOccurred()
}

@MainActor func batteryLevel() async throws -> Double {
    UIDevice.current.isBatteryMonitoringEnabled = true
    // -1 where there is no battery to read (the simulator).
    let level = UIDevice.current.batteryLevel
    return level < 0 ? -1 : Double(level)
}
