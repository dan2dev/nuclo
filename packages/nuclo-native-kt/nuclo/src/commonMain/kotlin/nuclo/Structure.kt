package nuclo

/** One node per item. A row is rebuilt only when its item is new: items are matched by identity (`===`),
 *  except String, Number, Boolean and Char items, which are matched by `==`. */
fun <T> list(items: () -> List<T>, render: (item: T, index: Int) -> Node?): Mod = ListMod(items, render)

class ListMod<T> internal constructor(private val items: () -> List<T>, private val render: (T, Int) -> Node?) : Mod() {
    @Suppress("UNCHECKED_CAST") internal fun itemsNow(): List<Any?> = items() as List<Any?>
    @Suppress("UNCHECKED_CAST") internal fun build(item: Any?, index: Int): Node? = (render as (Any?, Int) -> Node?)(item, index)
}

class WhenBuilder internal constructor() : Mod() {
    internal class Branch(val condition: () -> Boolean, val content: Array<Any>)
    internal val branches = ArrayList<Branch>()
    internal var otherwise: Array<Any>? = null

    fun when_(condition: Boolean, vararg content: Any?): WhenBuilder = when_({ condition }, *content)
    fun when_(condition: () -> Boolean, vararg content: Any?): WhenBuilder { branches.add(Branch(condition, content(content))); return this }
    fun else_(vararg content: Any?): WhenBuilder { otherwise = content(content); return this }
}

/** Shows the content of the first branch whose condition holds. A branch is mounted when it opens and
 *  destroyed when it closes. */
fun when_(condition: Boolean, vararg content: Any?): WhenBuilder = WhenBuilder().when_(condition, *content)
fun when_(condition: () -> Boolean, vararg content: Any?): WhenBuilder = WhenBuilder().when_(condition, *content)

class RegionMod internal constructor(internal val id: String, internal val stack: Boolean, internal val empty: Array<Any>) : Mod()
class IntoMod internal constructor(internal val id: String, internal val content: Array<Any>) : Mod()
class ScopeMod internal constructor(internal val ids: Array<out String>) : Mod()

/** A named place in the tree that into() fills from anywhere. stack = false shows only the newest content. */
fun region(id: String, stack: Boolean = false, vararg empty: Any?): Mod = RegionMod(id, stack, content(empty))
/** Puts content into region `id` for as long as this into() is mounted. */
fun into(id: String, vararg content: Any?): Mod = IntoMod(id, content(content))
/** Makes the node an update root: update("id") refreshes only what is inside it. */
fun scope(vararg ids: String): Mod = ScopeMod(ids)
