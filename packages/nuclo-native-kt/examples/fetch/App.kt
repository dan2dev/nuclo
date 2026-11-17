package app

import nuclo.*

/**
 * Network requests: text from example.org, typed JSON decoding, a JSON POST and a failing request.
 * The users request also starts when the app does, and prints one FETCH line when it finishes.
 */
class Geo(val lat: String, val lng: String)
class Address(val city: String, val zipcode: String, val geo: Geo)
class User(val id: Int, val name: String, val email: String, val address: Address)

const val API = "https://jsonplaceholder.typicode.com"

var page = "idle"
var users = listOf<User>()
var usersState = "idle"
var created = "idle"
var failed = "idle"
var reported = false

val card = Style(p = 16, gap = 8, rounded = 12, bg = "#ffffff", borderWidth = 1, borderColor = "#e2e8f0")

@Suppress("UNCHECKED_CAST")
fun toUser(any: Any?): User {
    val m = any as Map<String, Any?>
    val a = m["address"] as Map<String, Any?>
    val g = a["geo"] as Map<String, Any?>
    return User(
        (m["id"] as Double).toInt(), m["name"] as String, m["email"] as String,
        Address(a["city"] as String, a["zipcode"] as String, Geo(g["lat"] as String, g["lng"] as String)),
    )
}

fun report(status: Int, items: Int) {
    if (reported) return
    reported = true
    println("FETCH $status $items")
}

suspend fun loadPage() {
    page = "loading…"
    update()
    try {
        val res = fetch("https://example.org/")
        val html = res.text()
        page = "HTTP ${res.status}, ${html.length} characters, ${if (html.contains("Example Domain")) "has" else "lacks"} “Example Domain”"
    } catch (e: Exception) {
        page = "error: ${e.message}"
    }
    update()
}

suspend fun loadUsers() {
    usersState = "loading"
    update()
    var status = 0
    try {
        val res = fetch("$API/users?_limit=5")
        status = res.status
        if (!res.ok) throw Exception("HTTP ${res.status}")
        users = (res.json() as List<*>).map(::toUser)
        usersState = "ready"
    } catch (e: Exception) {
        usersState = "error: ${e.message}"
    }
    report(status, users.size)
    update()
}

@Suppress("UNCHECKED_CAST")
suspend fun createPost() {
    created = "sending…"
    update()
    try {
        val res = fetch(
            "$API/posts", method = "POST",
            headers = mapOf("Content-Type" to "application/json"),
            body = "{\"title\":\"hello from nuclo\",\"userId\":1}",
        )
        val body = res.json() as Map<String, Any?>
        created = "HTTP ${res.status}: id ${(body["id"] as Double).toInt()}, “${body["title"]}”"
    } catch (e: Exception) {
        created = "error: ${e.message}"
    }
    update()
}

suspend fun loadMissing() {
    failed = "loading…"
    update()
    try {
        val res = fetch("$API/missing")
        failed = if (res.ok) "unexpected success" else "HTTP ${res.status} handled"
    } catch (e: Exception) {
        failed = "error: ${e.message}"
    }
    update()
}

fun App() = div(
    style(Style(p = 24, gap = 16, bg = "#f8fafc")),
    h1("Fetch"),
    div(
        style(card),
        h2("Text · example.org"),
        p({ page }),
        button("Fetch page", onClick { launch { loadPage() } }),
    ),
    div(
        style(card),
        h2("JSON · typed decode"),
        p({ if (usersState == "ready") "${users.size} users" else usersState }),
        list({ users }) { user, _ ->
            div(
                p({ "${user.name} · ${user.email}" }),
                small({ "${user.address.city} (${user.address.geo.lat}, ${user.address.geo.lng})" }),
            )
        },
        button("Load users", onClick { launch { loadUsers() } }),
    ),
    div(
        style(card),
        h2("JSON · POST"),
        p({ created }),
        button("Create post", onClick { launch { createPost() } }),
    ),
    div(
        style(card),
        h2("Failure"),
        p({ failed }),
        button("Request a missing URL", onClick { launch { loadMissing() } }),
    ),
)

fun main() = runApp {
    render(::App)
    launch { loadUsers() }
}
