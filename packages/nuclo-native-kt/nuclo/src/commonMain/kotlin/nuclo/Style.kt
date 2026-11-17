package nuclo

// Generated once from a field table, then maintained by hand. Style is a plain class (not a data class):
// `normalized()` folds the short keys into the long ones, `merged()` and equality work on that form.

class Style(
    val flexDirection: FlexDirection? = null,
    val alignItems: Align? = null,
    val alignSelf: Align? = null,
    val justifyContent: Justify? = null,
    val flexWrap: FlexWrap? = null,
    val flex: Number? = null,
    val gap: Number? = null,
    val margin: Number? = null,
    val marginTop: Number? = null,
    val marginRight: Number? = null,
    val marginBottom: Number? = null,
    val marginLeft: Number? = null,
    val padding: Number? = null,
    val paddingTop: Number? = null,
    val paddingRight: Number? = null,
    val paddingBottom: Number? = null,
    val paddingLeft: Number? = null,
    val width: Number? = null,
    val widthPct: Number? = null,
    val height: Number? = null,
    val minWidth: Number? = null,
    val maxWidth: Number? = null,
    val minHeight: Number? = null,
    val maxHeight: Number? = null,
    val aspectRatio: Number? = null,
    val overflow: Overflow? = null,
    val position: Position? = null,
    val top: Number? = null,
    val right: Number? = null,
    val bottom: Number? = null,
    val left: Number? = null,
    val zIndex: Number? = null,
    val display: Display? = null,
    val backgroundColor: String? = null,
    val color: String? = null,
    val opacity: Number? = null,
    val borderRadius: Number? = null,
    val borderWidth: Number? = null,
    val borderColor: String? = null,
    val borderTopWidth: Number? = null,
    val borderRightWidth: Number? = null,
    val borderBottomWidth: Number? = null,
    val borderLeftWidth: Number? = null,
    val borderTopColor: String? = null,
    val borderRightColor: String? = null,
    val borderBottomColor: String? = null,
    val borderLeftColor: String? = null,
    val shadowColor: String? = null,
    val shadowRadius: Number? = null,
    val shadowOffsetX: Number? = null,
    val shadowOffsetY: Number? = null,
    val objectFit: ObjectFit? = null,
    val pointerEvents: PointerEvents? = null,
    val fontSize: Number? = null,
    val fontWeight: FontWeight? = null,
    val fontStyle: FontStyle? = null,
    val fontFamily: String? = null,
    val lineHeight: Number? = null,
    val letterSpacing: Number? = null,
    val textAlign: TextAlign? = null,
    val textDecoration: TextDecoration? = null,
    val textTransform: TextTransform? = null,
    val numberOfLines: Int? = null,
    val placeholderColor: String? = null,
    val translateX: Number? = null,
    val translateY: Number? = null,
    val scale: Number? = null,
    val rotate: Number? = null,
    val transitionDuration: Number? = null,
    val transitionDelay: Number? = null,
    val transitionEasing: Easing? = null,
    val animation: StyleAnimation? = null,
    val pressed: Style? = null,
    val hover: Style? = null,
    val focused: Style? = null,
    val disabled: Style? = null,
    val enabled: Style? = null,
    val checked: Style? = null,
    val placeholderShown: Style? = null,
    val first: Style? = null,
    val last: Style? = null,
    val only: Style? = null,
    val odd: Style? = null,
    val even: Style? = null,
    val empty: Style? = null,
    val media: List<MediaRule>? = null,
    val p: Number? = null,
    val px: Number? = null,
    val py: Number? = null,
    val pt: Number? = null,
    val pr: Number? = null,
    val pb: Number? = null,
    val pl: Number? = null,
    val m: Number? = null,
    val mx: Number? = null,
    val my: Number? = null,
    val mt: Number? = null,
    val mr: Number? = null,
    val mb: Number? = null,
    val ml: Number? = null,
    val w: Number? = null,
    val h: Number? = null,
    val size: Number? = null,
    val minW: Number? = null,
    val maxW: Number? = null,
    val minH: Number? = null,
    val maxH: Number? = null,
    val bg: String? = null,
    val rounded: Number? = null,
    val z: Number? = null,
    val text: Number? = null,
    val font: String? = null,
    val weight: FontWeight? = null,
    val leading: Number? = null,
    val tracking: Number? = null,
    val items: Align? = null,
    val justify: Justify? = null,
    val row: Boolean? = null,
    val col: Boolean? = null,
    val center: Boolean? = null,
    val truncate: Boolean? = null,
) {
    private var norm: Style? = null

    /** `other`'s set fields win; nested state styles and media rules merge too. */
    fun merged(other: Style): Style {
        val a = normalized()
        val o = other.normalized()
        return Style(
        flexDirection = o.flexDirection ?: a.flexDirection,
        alignItems = o.alignItems ?: a.alignItems,
        alignSelf = o.alignSelf ?: a.alignSelf,
        justifyContent = o.justifyContent ?: a.justifyContent,
        flexWrap = o.flexWrap ?: a.flexWrap,
        flex = o.flex ?: a.flex,
        gap = o.gap ?: a.gap,
        margin = o.margin ?: a.margin,
        marginTop = o.marginTop ?: if (o.margin != null) null else a.marginTop,
        marginRight = o.marginRight ?: if (o.margin != null) null else a.marginRight,
        marginBottom = o.marginBottom ?: if (o.margin != null) null else a.marginBottom,
        marginLeft = o.marginLeft ?: if (o.margin != null) null else a.marginLeft,
        padding = o.padding ?: a.padding,
        paddingTop = o.paddingTop ?: if (o.padding != null) null else a.paddingTop,
        paddingRight = o.paddingRight ?: if (o.padding != null) null else a.paddingRight,
        paddingBottom = o.paddingBottom ?: if (o.padding != null) null else a.paddingBottom,
        paddingLeft = o.paddingLeft ?: if (o.padding != null) null else a.paddingLeft,
        width = if (o.widthPct != null) null else o.width ?: a.width,
        widthPct = if (o.width != null) null else o.widthPct ?: a.widthPct,
        height = o.height ?: a.height,
        minWidth = o.minWidth ?: a.minWidth,
        maxWidth = o.maxWidth ?: a.maxWidth,
        minHeight = o.minHeight ?: a.minHeight,
        maxHeight = o.maxHeight ?: a.maxHeight,
        aspectRatio = o.aspectRatio ?: a.aspectRatio,
        overflow = o.overflow ?: a.overflow,
        position = o.position ?: a.position,
        top = o.top ?: a.top,
        right = o.right ?: a.right,
        bottom = o.bottom ?: a.bottom,
        left = o.left ?: a.left,
        zIndex = o.zIndex ?: a.zIndex,
        display = o.display ?: a.display,
        backgroundColor = o.backgroundColor ?: a.backgroundColor,
        color = o.color ?: a.color,
        opacity = o.opacity ?: a.opacity,
        borderRadius = o.borderRadius ?: a.borderRadius,
        borderWidth = o.borderWidth ?: a.borderWidth,
        borderColor = o.borderColor ?: a.borderColor,
        borderTopWidth = o.borderTopWidth ?: if (o.borderWidth != null) null else a.borderTopWidth,
        borderRightWidth = o.borderRightWidth ?: if (o.borderWidth != null) null else a.borderRightWidth,
        borderBottomWidth = o.borderBottomWidth ?: if (o.borderWidth != null) null else a.borderBottomWidth,
        borderLeftWidth = o.borderLeftWidth ?: if (o.borderWidth != null) null else a.borderLeftWidth,
        borderTopColor = o.borderTopColor ?: if (o.borderColor != null) null else a.borderTopColor,
        borderRightColor = o.borderRightColor ?: if (o.borderColor != null) null else a.borderRightColor,
        borderBottomColor = o.borderBottomColor ?: if (o.borderColor != null) null else a.borderBottomColor,
        borderLeftColor = o.borderLeftColor ?: if (o.borderColor != null) null else a.borderLeftColor,
        shadowColor = o.shadowColor ?: a.shadowColor,
        shadowRadius = o.shadowRadius ?: a.shadowRadius,
        shadowOffsetX = o.shadowOffsetX ?: a.shadowOffsetX,
        shadowOffsetY = o.shadowOffsetY ?: a.shadowOffsetY,
        objectFit = o.objectFit ?: a.objectFit,
        pointerEvents = o.pointerEvents ?: a.pointerEvents,
        fontSize = o.fontSize ?: a.fontSize,
        fontWeight = o.fontWeight ?: a.fontWeight,
        fontStyle = o.fontStyle ?: a.fontStyle,
        fontFamily = o.fontFamily ?: a.fontFamily,
        lineHeight = o.lineHeight ?: a.lineHeight,
        letterSpacing = o.letterSpacing ?: a.letterSpacing,
        textAlign = o.textAlign ?: a.textAlign,
        textDecoration = o.textDecoration ?: a.textDecoration,
        textTransform = o.textTransform ?: a.textTransform,
        numberOfLines = o.numberOfLines ?: a.numberOfLines,
        placeholderColor = o.placeholderColor ?: a.placeholderColor,
        translateX = o.translateX ?: a.translateX,
        translateY = o.translateY ?: a.translateY,
        scale = o.scale ?: a.scale,
        rotate = o.rotate ?: a.rotate,
        transitionDuration = o.transitionDuration ?: a.transitionDuration,
        transitionDelay = o.transitionDelay ?: a.transitionDelay,
        transitionEasing = o.transitionEasing ?: a.transitionEasing,
        animation = o.animation ?: a.animation,
        pressed = mergeState(a.pressed, o.pressed),
        hover = mergeState(a.hover, o.hover),
        focused = mergeState(a.focused, o.focused),
        disabled = mergeState(a.disabled, o.disabled),
        enabled = mergeState(a.enabled, o.enabled),
        checked = mergeState(a.checked, o.checked),
        placeholderShown = mergeState(a.placeholderShown, o.placeholderShown),
        first = mergeState(a.first, o.first),
        last = mergeState(a.last, o.last),
        only = mergeState(a.only, o.only),
        odd = mergeState(a.odd, o.odd),
        even = mergeState(a.even, o.even),
        empty = mergeState(a.empty, o.empty),
        media = if (o.media == null) a.media else if (a.media == null) o.media else a.media + o.media,
        )
    }

    operator fun plus(other: Style): Style = merged(other)

    /** The same style with every short key folded into its long key (the long key wins when both are set). */
    internal fun normalized(): Style {
        norm?.let { return it }
        val short = p != null || px != null || py != null || pt != null || pr != null || pb != null || pl != null || m != null || mx != null || my != null || mt != null || mr != null || mb != null || ml != null || w != null || h != null || size != null || minW != null || maxW != null || minH != null || maxH != null || bg != null || rounded != null || z != null || text != null || font != null || weight != null || leading != null || tracking != null || items != null || justify != null || row != null || col != null || center != null || truncate != null
        val nested = pressed != null || hover != null || focused != null || disabled != null || enabled != null || checked != null || placeholderShown != null || first != null || last != null || only != null || odd != null || even != null || empty != null || media != null
        val n = if (!short && !nested) this else Style(
            flexDirection = flexDirection ?: (if (row == true) FlexDirection.Row else if (col == true) FlexDirection.Column else null),
            alignItems = alignItems ?: items ?: (if (center == true) Align.Center else null),
            alignSelf = alignSelf,
            justifyContent = justifyContent ?: justify ?: (if (center == true) Justify.Center else null),
            flexWrap = flexWrap,
            flex = flex,
            gap = gap,
            margin = margin ?: m,
            marginTop = marginTop ?: mt ?: my,
            marginRight = marginRight ?: mr ?: mx,
            marginBottom = marginBottom ?: mb ?: my,
            marginLeft = marginLeft ?: ml ?: mx,
            padding = padding ?: p,
            paddingTop = paddingTop ?: pt ?: py,
            paddingRight = paddingRight ?: pr ?: px,
            paddingBottom = paddingBottom ?: pb ?: py,
            paddingLeft = paddingLeft ?: pl ?: px,
            width = width ?: w ?: size,
            widthPct = widthPct,
            height = height ?: h ?: size,
            minWidth = minWidth ?: minW,
            maxWidth = maxWidth ?: maxW,
            minHeight = minHeight ?: minH,
            maxHeight = maxHeight ?: maxH,
            aspectRatio = aspectRatio,
            overflow = overflow,
            position = position,
            top = top,
            right = right,
            bottom = bottom,
            left = left,
            zIndex = zIndex ?: z,
            display = display,
            backgroundColor = backgroundColor ?: bg,
            color = color,
            opacity = opacity,
            borderRadius = borderRadius ?: rounded,
            borderWidth = borderWidth,
            borderColor = borderColor,
            borderTopWidth = borderTopWidth,
            borderRightWidth = borderRightWidth,
            borderBottomWidth = borderBottomWidth,
            borderLeftWidth = borderLeftWidth,
            borderTopColor = borderTopColor,
            borderRightColor = borderRightColor,
            borderBottomColor = borderBottomColor,
            borderLeftColor = borderLeftColor,
            shadowColor = shadowColor,
            shadowRadius = shadowRadius,
            shadowOffsetX = shadowOffsetX,
            shadowOffsetY = shadowOffsetY,
            objectFit = objectFit,
            pointerEvents = pointerEvents,
            fontSize = fontSize ?: text,
            fontWeight = fontWeight ?: weight,
            fontStyle = fontStyle,
            fontFamily = fontFamily ?: font,
            lineHeight = lineHeight ?: leading,
            letterSpacing = letterSpacing ?: tracking,
            textAlign = textAlign,
            textDecoration = textDecoration,
            textTransform = textTransform,
            numberOfLines = numberOfLines ?: (if (truncate == true) 1 else null),
            placeholderColor = placeholderColor,
            translateX = translateX,
            translateY = translateY,
            scale = scale,
            rotate = rotate,
            transitionDuration = transitionDuration,
            transitionDelay = transitionDelay,
            transitionEasing = transitionEasing,
            animation = animation,
            pressed = pressed?.normalized(),
            hover = hover?.normalized(),
            focused = focused?.normalized(),
            disabled = disabled?.normalized(),
            enabled = enabled?.normalized(),
            checked = checked?.normalized(),
            placeholderShown = placeholderShown?.normalized(),
            first = first?.normalized(),
            last = last?.normalized(),
            only = only?.normalized(),
            odd = odd?.normalized(),
            even = even?.normalized(),
            empty = empty?.normalized(),
            media = media?.map { MediaRule(it.min, it.max, it.style.normalized()) },
        )
        norm = n
        return n
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Style) return false
        val a = normalized()
        val o = other.normalized()
        return a.same(o)
    }

    private fun same(o: Style): Boolean =
        flexDirection == o.flexDirection &&
        alignItems == o.alignItems &&
        alignSelf == o.alignSelf &&
        justifyContent == o.justifyContent &&
        flexWrap == o.flexWrap &&
        sameNum(flex, o.flex) &&
        sameNum(gap, o.gap) &&
        sameNum(margin, o.margin) &&
        sameNum(marginTop, o.marginTop) &&
        sameNum(marginRight, o.marginRight) &&
        sameNum(marginBottom, o.marginBottom) &&
        sameNum(marginLeft, o.marginLeft) &&
        sameNum(padding, o.padding) &&
        sameNum(paddingTop, o.paddingTop) &&
        sameNum(paddingRight, o.paddingRight) &&
        sameNum(paddingBottom, o.paddingBottom) &&
        sameNum(paddingLeft, o.paddingLeft) &&
        sameNum(width, o.width) &&
        sameNum(widthPct, o.widthPct) &&
        sameNum(height, o.height) &&
        sameNum(minWidth, o.minWidth) &&
        sameNum(maxWidth, o.maxWidth) &&
        sameNum(minHeight, o.minHeight) &&
        sameNum(maxHeight, o.maxHeight) &&
        sameNum(aspectRatio, o.aspectRatio) &&
        overflow == o.overflow &&
        position == o.position &&
        sameNum(top, o.top) &&
        sameNum(right, o.right) &&
        sameNum(bottom, o.bottom) &&
        sameNum(left, o.left) &&
        sameNum(zIndex, o.zIndex) &&
        display == o.display &&
        backgroundColor == o.backgroundColor &&
        color == o.color &&
        sameNum(opacity, o.opacity) &&
        sameNum(borderRadius, o.borderRadius) &&
        sameNum(borderWidth, o.borderWidth) &&
        borderColor == o.borderColor &&
        sameNum(borderTopWidth, o.borderTopWidth) &&
        sameNum(borderRightWidth, o.borderRightWidth) &&
        sameNum(borderBottomWidth, o.borderBottomWidth) &&
        sameNum(borderLeftWidth, o.borderLeftWidth) &&
        borderTopColor == o.borderTopColor &&
        borderRightColor == o.borderRightColor &&
        borderBottomColor == o.borderBottomColor &&
        borderLeftColor == o.borderLeftColor &&
        shadowColor == o.shadowColor &&
        sameNum(shadowRadius, o.shadowRadius) &&
        sameNum(shadowOffsetX, o.shadowOffsetX) &&
        sameNum(shadowOffsetY, o.shadowOffsetY) &&
        objectFit == o.objectFit &&
        pointerEvents == o.pointerEvents &&
        sameNum(fontSize, o.fontSize) &&
        fontWeight == o.fontWeight &&
        fontStyle == o.fontStyle &&
        fontFamily == o.fontFamily &&
        sameNum(lineHeight, o.lineHeight) &&
        sameNum(letterSpacing, o.letterSpacing) &&
        textAlign == o.textAlign &&
        textDecoration == o.textDecoration &&
        textTransform == o.textTransform &&
        numberOfLines == o.numberOfLines &&
        placeholderColor == o.placeholderColor &&
        sameNum(translateX, o.translateX) &&
        sameNum(translateY, o.translateY) &&
        sameNum(scale, o.scale) &&
        sameNum(rotate, o.rotate) &&
        sameNum(transitionDuration, o.transitionDuration) &&
        sameNum(transitionDelay, o.transitionDelay) &&
        transitionEasing == o.transitionEasing &&
        animation == o.animation &&
        pressed == o.pressed &&
        hover == o.hover &&
        focused == o.focused &&
        disabled == o.disabled &&
        enabled == o.enabled &&
        checked == o.checked &&
        placeholderShown == o.placeholderShown &&
        first == o.first &&
        last == o.last &&
        only == o.only &&
        odd == o.odd &&
        even == o.even &&
        empty == o.empty &&
        media == o.media

    override fun hashCode(): Int {
        val a = normalized()
        var h = 7
        h = h * 31 + (a.flexDirection?.hashCode() ?: 0)
        h = h * 31 + (a.alignItems?.hashCode() ?: 0)
        h = h * 31 + (a.alignSelf?.hashCode() ?: 0)
        h = h * 31 + (a.justifyContent?.hashCode() ?: 0)
        h = h * 31 + (a.flexWrap?.hashCode() ?: 0)
        h = h * 31 + numHash(a.flex)
        h = h * 31 + numHash(a.gap)
        h = h * 31 + numHash(a.margin)
        h = h * 31 + numHash(a.marginTop)
        h = h * 31 + numHash(a.marginRight)
        h = h * 31 + numHash(a.marginBottom)
        h = h * 31 + numHash(a.marginLeft)
        h = h * 31 + numHash(a.padding)
        h = h * 31 + numHash(a.paddingTop)
        h = h * 31 + numHash(a.paddingRight)
        h = h * 31 + numHash(a.paddingBottom)
        h = h * 31 + numHash(a.paddingLeft)
        h = h * 31 + numHash(a.width)
        h = h * 31 + numHash(a.widthPct)
        h = h * 31 + numHash(a.height)
        h = h * 31 + numHash(a.minWidth)
        h = h * 31 + numHash(a.maxWidth)
        h = h * 31 + numHash(a.minHeight)
        h = h * 31 + numHash(a.maxHeight)
        h = h * 31 + numHash(a.aspectRatio)
        h = h * 31 + (a.overflow?.hashCode() ?: 0)
        h = h * 31 + (a.position?.hashCode() ?: 0)
        h = h * 31 + numHash(a.top)
        h = h * 31 + numHash(a.right)
        h = h * 31 + numHash(a.bottom)
        h = h * 31 + numHash(a.left)
        h = h * 31 + numHash(a.zIndex)
        h = h * 31 + (a.display?.hashCode() ?: 0)
        h = h * 31 + (a.backgroundColor?.hashCode() ?: 0)
        h = h * 31 + (a.color?.hashCode() ?: 0)
        h = h * 31 + numHash(a.opacity)
        h = h * 31 + numHash(a.borderRadius)
        h = h * 31 + numHash(a.borderWidth)
        h = h * 31 + (a.borderColor?.hashCode() ?: 0)
        h = h * 31 + numHash(a.borderTopWidth)
        h = h * 31 + numHash(a.borderRightWidth)
        h = h * 31 + numHash(a.borderBottomWidth)
        h = h * 31 + numHash(a.borderLeftWidth)
        h = h * 31 + (a.borderTopColor?.hashCode() ?: 0)
        h = h * 31 + (a.borderRightColor?.hashCode() ?: 0)
        h = h * 31 + (a.borderBottomColor?.hashCode() ?: 0)
        h = h * 31 + (a.borderLeftColor?.hashCode() ?: 0)
        h = h * 31 + (a.shadowColor?.hashCode() ?: 0)
        h = h * 31 + numHash(a.shadowRadius)
        h = h * 31 + numHash(a.shadowOffsetX)
        h = h * 31 + numHash(a.shadowOffsetY)
        h = h * 31 + (a.objectFit?.hashCode() ?: 0)
        h = h * 31 + (a.pointerEvents?.hashCode() ?: 0)
        h = h * 31 + numHash(a.fontSize)
        h = h * 31 + (a.fontWeight?.hashCode() ?: 0)
        h = h * 31 + (a.fontStyle?.hashCode() ?: 0)
        h = h * 31 + (a.fontFamily?.hashCode() ?: 0)
        h = h * 31 + numHash(a.lineHeight)
        h = h * 31 + numHash(a.letterSpacing)
        h = h * 31 + (a.textAlign?.hashCode() ?: 0)
        h = h * 31 + (a.textDecoration?.hashCode() ?: 0)
        h = h * 31 + (a.textTransform?.hashCode() ?: 0)
        h = h * 31 + (a.numberOfLines?.hashCode() ?: 0)
        h = h * 31 + (a.placeholderColor?.hashCode() ?: 0)
        h = h * 31 + numHash(a.translateX)
        h = h * 31 + numHash(a.translateY)
        h = h * 31 + numHash(a.scale)
        h = h * 31 + numHash(a.rotate)
        h = h * 31 + numHash(a.transitionDuration)
        h = h * 31 + numHash(a.transitionDelay)
        h = h * 31 + (a.transitionEasing?.hashCode() ?: 0)
        h = h * 31 + (a.animation?.hashCode() ?: 0)
        h = h * 31 + (a.pressed?.hashCode() ?: 0)
        h = h * 31 + (a.hover?.hashCode() ?: 0)
        h = h * 31 + (a.focused?.hashCode() ?: 0)
        h = h * 31 + (a.disabled?.hashCode() ?: 0)
        h = h * 31 + (a.enabled?.hashCode() ?: 0)
        h = h * 31 + (a.checked?.hashCode() ?: 0)
        h = h * 31 + (a.placeholderShown?.hashCode() ?: 0)
        h = h * 31 + (a.first?.hashCode() ?: 0)
        h = h * 31 + (a.last?.hashCode() ?: 0)
        h = h * 31 + (a.only?.hashCode() ?: 0)
        h = h * 31 + (a.odd?.hashCode() ?: 0)
        h = h * 31 + (a.even?.hashCode() ?: 0)
        h = h * 31 + (a.empty?.hashCode() ?: 0)
        h = h * 31 + (a.media?.hashCode() ?: 0)
        return h
    }
}

private fun mergeState(a: Style?, b: Style?): Style? = if (b == null) a else a?.merged(b) ?: b.normalized()
private fun sameNum(a: Number?, b: Number?) = if (a == null || b == null) a == b else a.toDouble() == b.toDouble()
private fun numHash(a: Number?) = a?.toDouble()?.hashCode() ?: 0

enum class FlexDirection { Row, Column }
enum class Align { FlexStart, Center, FlexEnd, Stretch }
enum class Justify { FlexStart, Center, FlexEnd, SpaceBetween, SpaceAround, SpaceEvenly }
enum class FlexWrap { Nowrap, Wrap }
enum class Overflow { Visible, Hidden, Scroll }
enum class Position { Relative, Absolute }
enum class Display { Flex, None }
enum class FontWeight(val css: Int) { Light(300), Normal(400), Medium(500), Semibold(600), Bold(700) }
enum class FontStyle { Normal, Italic }
enum class TextAlign { Left, Center, Right }
enum class TextDecoration { None, Underline, LineThrough }
enum class TextTransform { None, Uppercase, Lowercase, Capitalize }
enum class ObjectFit { Cover, Contain, Fill }
enum class PointerEvents { Auto, None }
enum class Easing { Linear, Ease, EaseIn, EaseOut, EaseInOut, Spring }

/** A style merged while the window's width is within min…max (inclusive); null = unbounded. */
class MediaRule(val min: Number?, val max: Number?, val style: Style) {
    internal fun matches(width: Double) = (min == null || width >= min.toDouble()) && (max == null || width <= max.toDouble())
    override fun equals(other: Any?) = other is MediaRule && min?.toDouble() == other.min?.toDouble() && max?.toDouble() == other.max?.toDouble() && style == other.style
    override fun hashCode() = (min?.toDouble().hashCode() * 31 + max?.toDouble().hashCode()) * 31 + style.hashCode()
}
fun minWidth(px: Number, style: Style) = MediaRule(px, null, style)
fun maxWidth(px: Number, style: Style) = MediaRule(null, px, style)
fun widthBetween(min: Number, max: Number, style: Style) = MediaRule(min, max, style)
