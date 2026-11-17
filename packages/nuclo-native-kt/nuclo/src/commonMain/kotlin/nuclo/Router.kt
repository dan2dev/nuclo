package nuclo

typealias Params = Map<String, String>

enum class Presentation { Push, Modal }

class Route(
    val title: String? = null,
    val titleFor: ((Params) -> String)? = null,      // wins over `title`
    val presentation: Presentation = Presentation.Push,
    val header: Boolean = true,                      // false hides the navigation bar on this screen
    val onEndReached: ((Params) -> Unit)? = null,    // M8
    val view: (Params) -> Node,
)

/** icon: a semantic name each platform maps to its icon set: home, list, cloud, star, person, settings, search. */
class Tab(val path: String, val title: String, val icon: String = "")

class Outlet internal constructor(internal val router: Router)

interface Router {
    val path: String
    val canGoBack: Boolean
    fun go(path: String)          // pushes onto the current tab's stack; "/posts/:id" patterns give params
    fun back()
    fun replace(path: String)     // replaces the current screen, no transition
    fun reset(path: String)       // selects the tab that owns `path` and makes it the only screen there
    val outlet: Outlet
}

fun createRouter(routes: Map<String, Route>, tabs: List<Tab> = emptyList(), initial: String = "/"): Router =
    engineCreateRouter(routes, tabs, initial)

/** Route matching: split pattern and path on `/`; same number of segments; a `:name` segment captures. */
internal fun matchRoute(pattern: String, path: String): Params? {
    val parts = pattern.split("/")
    val segments = path.split("/")
    if (segments.size != parts.size) return null
    val params = LinkedHashMap<String, String>()
    for (i in parts.indices) {
        if (parts[i].startsWith(":")) params[parts[i].substring(1)] = segments[i] else if (parts[i] != segments[i]) return null
    }
    return params
}
