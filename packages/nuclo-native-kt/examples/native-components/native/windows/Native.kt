package app

import kotlinx.cinterop.*
import nuclo.*
import platform.windows.*

// Win32 controls from commctrl: a trackbar (msctls_trackbar32) and a progress bar for the gauge. Never run: link check only.
private const val TBM_SETRANGE = 0x0406u
private const val TBM_SETPOS = 0x0405u
private const val TBM_GETPOS = 0x0400u
private const val PBM_SETPOS = 0x0402u
private const val PBM_SETBARCOLOR = 0x0409u

private fun control(className: String, parent: HWND, style: UInt): HWND =
    CreateWindowExW(0u, className, "", (WS_CHILD or WS_VISIBLE).toUInt() or style, 0, 0, 0, 0, parent, null, GetModuleHandleW(null), null)!!

actual fun Slider(value: () -> Double, onChange: (Double) -> Unit, vararg mods: Any?): Node = nativeNode(
    create = { parent ->
        val bar = control("msctls_trackbar32", parent, 0u)
        SendMessageW(bar, TBM_SETRANGE, 1u, (100L shl 16))
        onNativeScroll(bar) { onChange(it.toDouble()) }
        bar
    },
    update = { SendMessageW(it, TBM_SETPOS, 1u, value().toLong()) },
    mods = mods,
)

actual fun Gauge(progress: () -> Double, color: () -> String, vararg mods: Any?): Node = nativeNode(
    create = { parent -> control("msctls_progress32", parent, 0u) },
    update = {
        val v = color().removePrefix("#").toLongOrNull(16) ?: 0
        SendMessageW(it, PBM_SETPOS, (progress() * 100).toInt().toULong(), 0)
        SendMessageW(it, PBM_SETBARCOLOR, 0u, ((v and 0xff) shl 16) or (v and 0xff00) or ((v shr 16) and 0xff))   // COLORREF is BGR
    },
    mods = mods,
)

actual fun platformName(): String = "Windows"
actual fun vibrate(milliseconds: Int) {}
actual fun batteryLevel(): Double = memScoped {
    val s = alloc<SYSTEM_POWER_STATUS>()
    if (GetSystemPowerStatus(s.ptr) == 0 || s.BatteryLifePercent.toInt() == 255) -1.0 else s.BatteryLifePercent.toInt() / 100.0
}
