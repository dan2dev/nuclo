package nuclo.core

import nuclo.*

// list / when_ / region / into: fragments that own no view (a port of the reconcilers in node.rs).

/** Rows are matched by `==` for String, Number, Boolean and Char items, by identity for everything else. */
private fun isValue(x: Any?) = x is String || x is Number || x is Boolean || x is Char
private fun sameItem(a: Any?, b: Any?) = if (isValue(a) && isValue(b)) a == b else a === b

private class Row(val item: Any?, val node: LiveNode?)

/** A row is rebuilt only when its item is new. */
internal fun mountList(parent: LiveNode, mod: ListMod<*>) {
    val fragment = LiveNode(null, "list")
    parent.append(fragment)
    var rows = ArrayList<Row>()
    fragment.reconcile = {
        val next = mod.itemsNow()
        // by hash first: identical objects share a hash, and sameItem decides inside a bucket
        val buckets = HashMap<Int, ArrayList<Int>>(rows.size * 2)
        rows.forEachIndexed { i, r -> buckets.getOrPut(r.item.hashCode()) { ArrayList() }.add(i) }
        val used = BooleanArray(rows.size)
        val fresh = ArrayList<LiveNode>()
        val built = ArrayList<Row>(next.size)
        var changed = next.size != rows.size
        next.forEachIndexed { index, item ->
            val bucket = buckets[item.hashCode()]
            var found = -1
            if (bucket != null) for (k in bucket.indices) { val i = bucket[k]; if (!used[i] && sameItem(rows[i].item, item)) { found = i; bucket.removeAt(k); break } }
            if (found >= 0) {
                used[found] = true
                if (found != index) changed = true
                built.add(rows[found])
            } else {
                val node = mod.build(item, index)?.let { mount(it) }
                if (node != null) { node.parent = fragment; fresh.add(node) }
                built.add(Row(item, node))
                changed = true
            }
        }
        rows.forEachIndexed { i, r -> if (!used[i]) r.node?.destroy() }
        rows = built
        if (changed) {
            fragment.children = ArrayList(built.mapNotNull { it.node })
            for (n in fresh) n.applyStylesDeep()
            fragment.syncViews()
        }
    }
    fragment.reconcile!!()
}

/** The content of the first branch whose condition holds; a branch is mounted when it opens and destroyed when it closes. */
internal fun mountWhen(parent: LiveNode, mod: WhenBuilder) {
    val fragment = LiveNode(null, "when")
    parent.append(fragment)
    var active = -2
    val branches = ArrayList(mod.branches)
    val otherwise = mod.otherwise
    fragment.reconcile = {
        val next = branches.indexOfFirst { it.condition() }
        if (next != active) {
            active = next
            for (c in ArrayList(fragment.children)) c.destroy()
            fragment.children = ArrayList()
            val content = if (next >= 0) branches[next].content else otherwise
            content?.forEach { applyChild(fragment, it) }
            for (c in ArrayList(fragment.children)) c.applyStylesDeep()
            fragment.syncViews()
            Runtime.mountPending = true
        }
    }
    fragment.reconcile!!()
}

private class IntoEntry(val content: Array<Any>) {
    var holder: LiveNode? = null
    fun close() { holder?.destroy(); holder = null }
}

private class RegionState(val fragment: LiveNode, val stack: Boolean, val empty: Array<Any>) {
    val entries = ArrayList<IntoEntry>()
    private var emptyHolder: LiveNode? = null

    private fun hold(tag: String, content: Array<Any>): LiveNode {
        val holder = LiveNode(null, tag)
        holder.parent = fragment
        content.forEach { applyChild(holder, it) }
        holder.applyStylesDeep()
        return holder
    }

    /** Shows the newest entry (or all of them, stacked), building only those not shown yet. */
    fun render() {
        val hidden = if (stack) 0 else maxOf(0, entries.size - 1)
        for (e in entries.take(hidden)) e.close()
        val children = ArrayList<LiveNode>()
        for (e in entries.drop(hidden)) {
            val holder = e.holder ?: hold("into", e.content).also { e.holder = it }
            children.add(holder)
        }
        if (children.isEmpty() && empty.isNotEmpty()) {
            children.add(emptyHolder ?: hold("empty", empty).also { emptyHolder = it })
        } else { emptyHolder?.destroy(); emptyHolder = null }
        fragment.children = children
        fragment.syncViews()
        Runtime.mountPending = true
    }
}

private val regions = HashMap<String, RegionState>()
private val waiting = HashMap<String, ArrayList<IntoEntry>>()

internal fun resetRegions() { regions.clear(); waiting.clear() }

/** A named place in the tree that into() fills from anywhere. */
internal fun mountRegion(parent: LiveNode, mod: RegionMod) {
    val fragment = LiveNode(null, "region")
    parent.append(fragment)
    val id = mod.id
    val state = RegionState(fragment, mod.stack, mod.empty)
    regions[id] = state
    waiting.remove(id)?.let { state.entries.addAll(it) }
    state.render()
    fragment.teardown.add {
        // The region goes: its views wait for the next region with this id.
        val entries = ArrayList(state.entries)
        state.entries.clear()
        for (e in entries) e.close()
        if (regions[id] === state) regions.remove(id)
        waiting.getOrPut(id) { ArrayList() }.addAll(entries)
    }
}

/** Puts content into region `id` for as long as this into() is mounted. */
internal fun mountInto(parent: LiveNode, mod: IntoMod) {
    val anchor = LiveNode(null, "into-anchor")
    parent.append(anchor)
    val id = mod.id
    val entry = IntoEntry(mod.content)
    val region = regions[id]
    if (region != null) { region.entries.add(entry); region.render() } else waiting.getOrPut(id) { ArrayList() }.add(entry)
    anchor.teardown.add {
        entry.close()
        regions[id]?.let { r -> if (r.entries.remove(entry)) r.render() }
        waiting[id]?.remove(entry)
    }
}
