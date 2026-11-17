package nuclo

class InputTarget(val value: String, val checked: Boolean)
class NativeEvent(val target: InputTarget)
class PointerEvent(val x: Double, val y: Double, val pageX: Double, val pageY: Double, val pointerId: Int)
class PanEvent(val state: String, val translationX: Double, val translationY: Double,
               val velocityX: Double, val velocityY: Double, val x: Double, val y: Double)   // state: "start" | "move" | "end" | "cancel"
class PinchEvent(val state: String, val scale: Double, val focalX: Double, val focalY: Double)
class ScrollEvent(val scrollTop: Double, val scrollLeft: Double, val scrollHeight: Double,
                  val scrollWidth: Double, val clientHeight: Double, val clientWidth: Double)
class KeyboardEvent(val key: String)                // DOM names: "Enter", "Escape", "ArrowLeft", "a"
/** The platform view behind a node: android.view.View, UIView, NSView, a GtkWidget pointer, an HWND, or a DOM element. */
class NativeElement(val handle: Any)
