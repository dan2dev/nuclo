package nuclo

import kotlinx.cinterop.toLong
import platform.windows.HWND

private val notifications = HashMap<Long, (Int) -> kotlin.Unit>()

/** Platform code asks to hear a control's position changes (a trackbar's WM_HSCROLL). */
fun onNativeScroll(control: HWND, handler: (Int) -> kotlin.Unit) { notifications[control.toLong()] = handler }

internal fun nativeScrolled(control: Long, position: Int) { notifications[control]?.invoke(position) }

/** A platform control as a node. `create` gets the app's window to be the control's parent, and runs once when the node
 *  is mounted; `update` runs right after, and again on every update(). */
@Suppress("UNCHECKED_CAST")
fun nativeNode(create: (parent: HWND) -> HWND, update: (HWND) -> kotlin.Unit = {}, vararg mods: Any?): Node =
    nativeDescriptor({ create(mainWindow()!!) }, { update(it as HWND) }, mods)
