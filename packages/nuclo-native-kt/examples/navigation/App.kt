package app

import nuclo.*

// Navigation with the platform's own stacks, tabs and sheets.
// On the web the address is the URL fragment; natively the router keeps the stacks.

class Album(val id: Int, val title: String, val artist: String, val year: Int, val color: String, val tracks: List<String>)

val albums = listOf(
    Album(1, "Blue Hours", "Mira Lowe", 2021, "#4f46e5", listOf("Dawn", "Ferry", "Glasshouse", "Blue Hours", "Last Train")),
    Album(2, "Salt & Signal", "The Tidewaters", 2019, "#0d9488", listOf("Low Tide", "Signal Fire", "Harbour Lights", "Driftwood")),
    Album(3, "Paper Cities", "Okafor", 2023, "#db2777", listOf("Blueprint", "Night Bus", "Paper Cities", "Rooftops", "Open Late", "Home")),
    Album(4, "Slow Machines", "Ansel & June", 2017, "#ea580c", listOf("Warm Up", "Slow Machines", "Copper", "Idle")),
)

var query = ""
var playingAlbum = 1
var playingTrack = 0
var paused = false

fun albumOf(id: String): Album? = albums.firstOrNull { it.id.toString() == id }

fun matches(): List<Album> {
    val needle = query.trim().lowercase()
    return albums.filter { needle.isEmpty() || it.title.lowercase().contains(needle) || it.artist.lowercase().contains(needle) }
}

val screen = Style(p = 20, gap = 14, bg = "#f8fafc")
val muted = css(Style(color = "#64748b", fontSize = 13))
val rowCard = css(Style(row = true, items = Align.Center, gap = 14, p = 12, rounded = 16, bg = "#ffffff", borderWidth = 1, borderColor = "#e2e8f0", pressed = Style(bg = "#eef2ff")))
val primary = css(Style(p = 14, rounded = 14, bg = "#4f46e5", items = Align.Center, pressed = Style(opacity = 0.7)))
val secondary = css(Style(p = 14, rounded = 14, bg = "#e0e7ff", items = Align.Center, pressed = Style(opacity = 0.7)))
val onPrimary = Style(color = "#ffffff", fontWeight = FontWeight.Bold)
val onSecondary = Style(color = "#3730a3", fontWeight = FontWeight.Bold)
val chevron = Style(fontSize = 22, color = "#94a3b8")

fun Cover(album: Album, size: Int): Node =
    div(
        style(Style(w = size, h = size, rounded = size / 5.0, bg = album.color, items = Align.Center, justify = Justify.Center)),
        span("♪", style(Style(color = "#ffffff", fontSize = size / 2.4))),
    )

fun AlbumRow(album: Album): Node =
    div(
        rowCard,
        onClick { router.go("/albums/${album.id}") },
        Cover(album, 56),
        div(style(Style(flex = 1, gap = 2)), strong(album.title), small("${album.artist} · ${album.year}", muted)),
        span("›", style(chevron)),
    )

fun Library(): Node = div(style(screen), h1("Library", style(Style(fontSize = 28))), list({ albums }) { album, _ -> AlbumRow(album) })

fun AlbumScreen(params: Params): Node {
    val album = albumOf(params["id"] ?: "") ?: return div(style(screen), p("This album is not in the library."))
    return div(
        style(screen),
        div(
            style(Style(items = Align.Center, gap = 10, paddingTop = 8)),
            Cover(album, 160), h2(album.title), small("${album.artist} · ${album.year}", muted),
        ),
        list({ album.tracks }) { track, index ->
            div(
                rowCard,
                onClick { router.go("/albums/${album.id}/tracks/$index") },
                span("${index + 1}", style(Style(w = 24, color = "#94a3b8", textAlign = TextAlign.Center))),
                span(track, style(Style(flex = 1))),
                span("›", style(chevron)),
            )
        },
    )
}

fun TrackScreen(params: Params): Node {
    val album = albumOf(params["id"] ?: "") ?: return div(style(screen), p("This track is not in the library."))
    val index = (params["track"] ?: "0").toIntOrNull() ?: 0
    val next = (index + 1) % album.tracks.size
    return div(
        style(screen),
        div(
            style(Style(items = Align.Center, gap = 10, paddingTop = 8)),
            Cover(album, 120),
            h2(album.tracks.getOrNull(index) ?: "Unknown track"),
            small("${album.title} · track ${index + 1} of ${album.tracks.size}", muted),
        ),
        div(
            primary,
            onClick {
                playingAlbum = album.id
                playingTrack = index
                paused = false
                router.go("/player")
            },
            span("Play", style(onPrimary)),
        ),
        div(secondary, onClick { router.replace("/albums/${album.id}/tracks/$next") }, span("Next track (replace)", style(onSecondary))),
        div(secondary, onClick { router.back() }, span("Back to the album", style(onSecondary))),
        div(secondary, onClick { router.reset("/") }, span("Library (reset)", style(onSecondary))),
        small({ "You are at ${router.path}" }, muted, style(Style(textAlign = TextAlign.Center))),
    )
}

/** A sheet: presented over the tabs, dismissed by back(). */
fun Player(): Node {
    val album = albums.firstOrNull { it.id == playingAlbum } ?: albums[0]
    return div(
        style(Style(flex = 1, p = 24, gap = 18, items = Align.Center, justify = Justify.Center, bg = "#0f172a")),
        div(style(Style(w = 44, h = 5, rounded = 3, bg = "#475569"))),
        Cover(album, 220),
        h2({ album.tracks.getOrNull(playingTrack) ?: "" }, style(Style(color = "#ffffff"))),
        small(album.artist, style(Style(color = "#94a3b8"))),
        div(
            style(Style(row = true, gap = 12)),
            div(
                secondary, style(Style(w = 120)),
                onClick { paused = !paused; update() },
                span({ if (paused) "Resume" else "Pause" }, style(onSecondary)),
            ),
            div(
                secondary, style(Style(w = 120)),
                onClick { playingTrack = (playingTrack + 1) % album.tracks.size; update() },
                span("Next", style(onSecondary)),
            ),
        ),
        div(primary, style(Style(w = 252)), onClick { router.back() }, span("Close", style(onPrimary))),
    )
}

fun Search(): Node = div(
    style(screen),
    input(
        placeholder("Albums and artists"),
        value { query },
        style(Style(p = 12, rounded = 12, borderWidth = 1, borderColor = "#cbd5e1", bg = "#ffffff", focused = Style(borderColor = "#4f46e5"))),
        onInput { query = it.target.value; update() },
    ),
    small({ "${matches().size} of ${albums.size} albums" }, muted),
    list({ matches() }) { album, _ -> AlbumRow(album) },
)

fun Profile(): Node = div(
    style(screen),
    h1("Profile", style(Style(fontSize = 28))),
    p({ "Now playing: ${albums.firstOrNull { it.id == playingAlbum }?.title ?: "nothing"}" }, muted),
    div(primary, onClick { router.go("/player") }, span("Open the player", style(onPrimary))),
    div(secondary, onClick { router.reset("/albums/3") }, span("Jump to “Paper Cities”", style(onSecondary))),
)

val router: Router = createRouter(
    linkedMapOf(
        "/" to Route(view = { Library() }, title = "Library"),
        "/albums/:id" to Route(view = ::AlbumScreen, titleFor = { albumOf(it["id"] ?: "")?.title ?: "Album" }),
        "/albums/:id/tracks/:track" to Route(view = ::TrackScreen, title = "Track"),
        "/search" to Route(view = { Search() }, title = "Search"),
        "/profile" to Route(view = { Profile() }, title = "Profile"),
        "/player" to Route(view = { Player() }, presentation = Presentation.Modal, header = false),
    ),
    listOf(Tab("/", "Library", "home"), Tab("/search", "Search", "search"), Tab("/profile", "Profile", "person")),
)

fun main() = runApp { render(router.outlet) }
