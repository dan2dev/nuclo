package app

import nuclo.*
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Gestures: a handler changes plain state and calls update(); a release animates with a transition.
 *   Drag     onPan moves a card with the finger; letting go springs it back
 *   Swipe    list rows follow a horizontal pan and are archived past a threshold
 *   Pinch    onPinch scales a tile, onDoubleClick resets it, onLongPress changes its colour
 *   Pointer  onPointerDown / Move / Up report where the pointer is
 */
class Mail(val id: Int, val from: String, val subject: String) {
    var x = 0.0
    var swiping = false
    var leaving = false
}

// Drag
var cardX = 0.0
var cardY = 0.0
var dragging = false
var drops = 0

// Swipe
var nextMail = 5
var mails = mutableListOf(
    Mail(1, "Ada", "The engine prints its own tables"),
    Mail(2, "Grace", "Found the moth, taped it in the log"),
    Mail(3, "Linus", "Just a hobby, won't be big"),
    Mail(4, "Margaret", "Priority displays saved the landing"),
)
var archived = 0

// Pinch
var zoom = 1.0
var zoomStart = 1.0
var warm = false

// Pointer
var pointerX = 0.0
var pointerY = 0.0
var pointerDown = false

val page = Style(p = 20, gap = 16, bg = "#f1f5f9")
val card = css(Style(p = 16, gap = 12, bg = "#ffffff", rounded = 16, shadowRadius = 12, shadowOffsetY = 4, shadowColor = "#0f172a1f"))
val muted = css(Style(color = "#64748b", fontSize = 13))
val stage = css(Style(h = 180, rounded = 12, bg = "#e2e8f0", items = Align.Center, justify = Justify.Center, overflow = Overflow.Hidden))

fun DragCard() = div(
    card,
    scope("drag"),
    h2("Drag"),
    div(
        stage,
        div(
            style {
                Style(
                    w = 150, h = 96, rounded = 18, items = Align.Center, justify = Justify.Center,
                    bg = if (dragging) "#4338ca" else "#6366f1",
                    shadowRadius = if (dragging) 28 else 10,
                    shadowOffsetY = if (dragging) 14 else 4,
                    shadowColor = "#4338ca66",
                    translateX = cardX, translateY = cardY, rotate = cardX / 14,
                    scale = if (dragging) 1.08 else 1,
                    // While the finger is down the card follows it exactly; released, it springs home.
                    transitionDuration = if (dragging) 0 else 480,
                    transitionEasing = Easing.Spring,
                )
            },
            onPan { e ->
                dragging = e.state == "start" || e.state == "move"
                if (dragging) {
                    cardX = e.translationX
                    cardY = e.translationY
                } else {
                    cardX = 0.0
                    cardY = 0.0
                    drops++
                }
                update("drag")
            },
            span("Drag me", style(Style(color = "#ffffff", fontWeight = FontWeight.Bold))),
        ),
    ),
    small({ "x ${cardX.roundToInt()}  y ${cardY.roundToInt()}  ·  released $drops times" }, muted),
)

fun archive(mail: Mail, direction: Int) {
    mail.leaving = true
    mail.swiping = false
    mail.x = direction * 420.0
    update("mail")
    // The row leaves the list once its exit has played.
    setTimeout(220) {
        mails = mails.filter { it !== mail }.toMutableList()
        archived++
        update("mail")
    }
}

fun MailRow(mail: Mail) = div(
    style(Style(rounded = 12, bg = "#dcfce7", overflow = Overflow.Hidden)),
    div(
        style(Style(position = Position.Absolute, top = 0, bottom = 0, left = 16, justify = Justify.Center)),
        span("Archive", style(Style(color = "#15803d", fontWeight = FontWeight.Bold))),
    ),
    div(
        style {
            Style(
                p = 14, gap = 2, bg = "#ffffff", borderWidth = 1, borderColor = "#e2e8f0", rounded = 12,
                translateX = mail.x,
                opacity = if (mail.leaving) 0 else 1,
                transitionDuration = if (mail.swiping) 0 else 220,
                transitionEasing = Easing.EaseOut,
            )
        },
        onPan { e ->
            if (mail.leaving) return@onPan
            if (e.state == "start" || e.state == "move") {
                mail.swiping = true
                mail.x = e.translationX
                update("mail")
            } else if (abs(mail.x) > 110 || abs(e.velocityX) > 900) {
                archive(mail, if (mail.x < 0) -1 else 1)
            } else {
                mail.swiping = false
                mail.x = 0.0
                update("mail")
            }
        },
        span(mail.from, style(Style(fontWeight = FontWeight.Bold, color = "#0f172a"))),
        span(mail.subject, muted, style(Style(numberOfLines = 1))),
    ),
)

fun SwipeList() = div(
    card,
    scope("mail"),
    h2("Swipe"),
    div(style(Style(gap = 8)), list({ mails }) { mail, _ -> MailRow(mail) }),
    div(
        style(Style(row = true, items = Align.Center, justify = Justify.SpaceBetween)),
        small({ "${mails.size} in the inbox, $archived archived" }, muted),
        span(
            "New mail",
            style(Style(color = "#4f46e5", fontWeight = FontWeight.Bold, p = 6, pressed = Style(opacity = 0.5))),
            onClick {
                nextMail++
                mails.add(Mail(nextMail, "Barbara", "Abstraction number $nextMail"))
                update("mail")
            },
        ),
    ),
)

fun zoomText(): String {
    val r = (zoom * 100).roundToInt()
    return "${r / 100}.${(r % 100).toString().padStart(2, '0')}×"
}

fun PinchTile() = div(
    card,
    scope("pinch"),
    h2("Pinch, double tap, long press"),
    div(
        stage,
        onPinch { e ->
            if (e.state == "start") zoomStart = zoom
            zoom = max(0.5, min(3.0, zoomStart * e.scale))
            update("pinch")
        },
        onDoubleClick {
            zoom = if (zoom > 1.01) 1.0 else 2.0
            update("pinch")
        },
        onLongPress {
            warm = !warm
            update("pinch")
        },
        div(
            style {
                Style(
                    w = 90, h = 90, rounded = 20, items = Align.Center, justify = Justify.Center,
                    bg = if (warm) "#f97316" else "#0ea5e9",
                    scale = zoom,
                    transitionDuration = 160,
                    transitionEasing = Easing.EaseOut,
                )
            },
            span({ zoomText() }, style(Style(color = "#ffffff", fontWeight = FontWeight.Bold))),
        ),
    ),
    small("Two fingers (or ctrl + wheel) scale it. Double tap toggles 2×. Hold to change the colour.", muted),
)

fun PointerPad() = div(
    card,
    scope("pointer"),
    h2("Pointer"),
    div(
        style(Style(h = 140, rounded = 12, bg = "#0f172a", overflow = Overflow.Hidden)),
        onPointerDown { e ->
            pointerDown = true
            pointerX = e.x
            pointerY = e.y
            update("pointer")
        },
        onPointerMove { e ->
            pointerX = e.x
            pointerY = e.y
            update("pointer")
        },
        onPointerUp {
            pointerDown = false
            update("pointer")
        },
        onPointerCancel {
            pointerDown = false
            update("pointer")
        },
        div(
            style {
                Style(
                    position = Position.Absolute, left = pointerX - 14, top = pointerY - 14, w = 28, h = 28, rounded = 14,
                    bg = "#38bdf8",
                    opacity = if (pointerDown) 1 else 0.35,
                    scale = if (pointerDown) 1.5 else 1,
                )
            },
        ),
    ),
    small({ "${if (pointerDown) "down" else "up"} at ${pointerX.roundToInt()}, ${pointerY.roundToInt()}" }, muted),
)

fun App() = div(
    style(page),
    DragCard(), SwipeList(), PinchTile(), PointerPad(),
    p("Every handler above is a plain function that changes a variable and calls update().", muted),
)

fun main() = runApp { render(::App) }
