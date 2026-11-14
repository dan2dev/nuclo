import Foundation
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// A native leaf. The host owns its frame and calls dispose when it removes the view.
@MainActor
struct NativeComponent {
    let view: View
    let update: (Data) -> Void
    var dispose: () -> Void = {}
}

typealias NativeComponentFactory = @MainActor (@escaping (any Encodable) -> Void) -> NativeComponent

@MainActor
func setAccessibility(_ view: View, _ key: String, _ value: Any) {
    let text = value as? String
    let enabled = text == "true" || (value as? Bool) == true
    #if os(macOS)
    let view = (view as? MultilineField)?.editor ?? view
    switch key {
    case "aria-label":
        if let label = view as? TextView { label.spokenLabel = text }
        else { view.setAccessibilityLabel(text) }
        if view is ImageView { view.setAccessibilityElement(!(text ?? "").isEmpty) }
    case "aria-description": view.setAccessibilityHelp(text)
    case "aria-hidden": view.setAccessibilityHidden(enabled)
    case "aria-selected": view.setAccessibilitySelected(enabled)
    case "role":
        if view is Box || view is TextView {
            view.setAccessibilityElement(text == "button" || view is TextView)
            view.setAccessibilityRole(text == "button" ? .button : text == "heading" ? .init(rawValue: "AXHeading") : view is TextView ? .staticText : nil)
        }
    default: break
    }
    #else
    switch key {
    case "aria-label":
        view.accessibilityLabel = text
        if view is ImageView { view.isAccessibilityElement = !view.accessibilityElementsHidden && !(text ?? "").isEmpty }
    case "aria-description": view.accessibilityHint = text
    case "aria-hidden":
        view.accessibilityElementsHidden = enabled
        if view is Box {
            view.isAccessibilityElement = !enabled && view.accessibilityTraits.contains(.button)
        } else if view is ImageView {
            view.isAccessibilityElement = !enabled && !(view.accessibilityLabel ?? "").isEmpty
        } else if view is TextView || view is Control || view is MultilineField {
            view.isAccessibilityElement = !enabled
        }
    case "aria-selected":
        if enabled { view.accessibilityTraits.insert(.selected) }
        else { view.accessibilityTraits.remove(.selected) }
    case "role":
        view.accessibilityTraits.remove(.header)
        if text == "heading" { view.accessibilityTraits.insert(.header) }
        if view is Box {
            if text == "button" { view.accessibilityTraits.insert(.button) }
            else { view.accessibilityTraits.remove(.button) }
            view.isAccessibilityElement = !view.accessibilityElementsHidden && text == "button"
        }
    default: break
    }
    #endif
}
