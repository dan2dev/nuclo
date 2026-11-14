// Device data for the Apple host (src/device.ts): the battery.
//
// macOS: IOKit's power sources, with a run-loop notification on every change.
// iOS:   UIDevice battery monitoring and its level / state notifications.
import Foundation
#if os(macOS)
import IOKit.ps
#else
import UIKit
#endif

extension Host {
    /// __nuclo_device(name): JSON now, or "" when the device has none. Starts watching. JS waits for it (Engine.device).
    func device(_ name: String) -> String {
        if name == "frames" { return framesJSON() }
        guard name == "battery" else { return "" }
        watchBattery()
        lastBattery = readBattery()
        return lastBattery
    }

    /// The battery changed: tell JS, which answers with a batch.
    func batteryChanged() {
        let json = readBattery()
        guard json != lastBattery else { return }
        lastBattery = json
        engine.post { $0.deviceChanged("battery", json) }
    }
}

/// {"level": 0..1 | null, "state": …, "minutes": n | null}
func batteryJSON(level: Double?, state: String, minutes: Int?) -> String {
    let level = level.map { String(format: "%.3f", $0) } ?? "null"
    let minutes = minutes.map(String.init) ?? "null"
    return #"{"level":\#(level),"state":"\#(state)","minutes":\#(minutes)}"#
}

#if os(macOS)

extension Host {
    func watchBattery() {
        guard batteryWatch == nil else { return }
        // A C callback: it captures nothing, so it reaches the host through the global.
        let callback: IOPowerSourceCallbackType = { _ in MainActor.assumeIsolated { host.batteryChanged() } }
        guard let source = IOPSNotificationCreateRunLoopSource(callback, nil)?.takeRetainedValue() else { return }
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .defaultMode)
        batteryWatch = source
    }

    func readBattery() -> String {
        guard let info = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
              let sources = IOPSCopyPowerSourcesList(info)?.takeRetainedValue() as? [CFTypeRef]
        else { return "" }
        for source in sources {
            guard let battery = IOPSGetPowerSourceDescription(info, source)?.takeUnretainedValue() as? [String: Any],
                  battery[kIOPSTypeKey] as? String == kIOPSInternalBatteryType
            else { continue }
            let current = battery[kIOPSCurrentCapacityKey] as? Double ?? 0
            let capacity = battery[kIOPSMaxCapacityKey] as? Double ?? 100
            let charging = battery[kIOPSIsChargingKey] as? Bool ?? false
            let onPower = battery[kIOPSPowerSourceStateKey] as? String == kIOPSACPowerValue
            let charged = battery[kIOPSIsChargedKey] as? Bool ?? false
            // On power but not charging (and not full): macOS is holding the charge.
            let state = charging ? "charging" : onPower ? (charged || current >= capacity ? "full" : "unknown") : "discharging"
            let time = battery[charging ? kIOPSTimeToFullChargeKey : kIOPSTimeToEmptyKey] as? Int
            let minutes = state == "charging" || state == "discharging" ? time.flatMap { $0 > 0 ? $0 : nil } : nil
            return batteryJSON(level: capacity > 0 ? current / capacity : nil, state: state, minutes: minutes)
        }
        return ""
    }
}

#else

extension Host {
    func watchBattery() {
        guard batteryWatch == nil else { return }
        UIDevice.current.isBatteryMonitoringEnabled = true
        let names = [UIDevice.batteryLevelDidChangeNotification, UIDevice.batteryStateDidChangeNotification]
        batteryWatch = names.map { name in
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { _ in
                MainActor.assumeIsolated { host.batteryChanged() }
            }
        } as NSArray
    }

    func readBattery() -> String {
        let device = UIDevice.current
        let state = switch device.batteryState {
        case .charging: "charging"
        case .full: "full"
        case .unplugged: "discharging"
        default: "unknown"
        }
        // The simulator reports neither: no battery.
        guard device.batteryLevel >= 0 || state != "unknown" else { return "" }
        return batteryJSON(level: device.batteryLevel >= 0 ? Double(device.batteryLevel) : nil, state: state, minutes: nil)
    }
}

#endif
