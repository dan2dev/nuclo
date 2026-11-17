package app

import nuclo.*

class Todo(var title: String, var done: Boolean = false)

val todos = mutableListOf(Todo("Write the spec", done = true), Todo("Port the core"))
var draft = ""

val card = css(Style(p = 16, gap = 12, bg = "#ffffff", rounded = 12, borderWidth = 1, borderColor = "#e2e8f0"))
val rowStyle = css(Style(row = true, items = Align.Center, gap = 8, pressed = Style(bg = "#eef2ff")))

fun add() {
    if (draft.isBlank()) return
    todos += Todo(draft)
    draft = ""
    update()
}

fun App() = div(
    style(Style(p = 24, gap = 16, bg = "#f8fafc")),
    h1("Todos"),
    div(
        card,
        div(
            style(Style(row = true, gap = 8)),
            input(style(Style(flex = 1)), placeholder("What needs doing?"), value { draft },
                  onInput { draft = it.target.value; update() }, onChange { add() }),
            button("Add", onClick { add() }, disabled { draft.isBlank() }),
        ),
        when_({ todos.isEmpty() }, p("Nothing to do.")).else_(
            ul(
                style(Style(gap = 4)),
                list({ todos }) { todo, _ ->
                    li(
                        rowStyle,
                        input(type("checkbox"), ariaLabel(todo.title), checked { todo.done },
                              onChange { todo.done = it.target.checked; update() }),
                        span(style { Style(flex = 1, textDecoration = if (todo.done) TextDecoration.LineThrough else TextDecoration.None) },
                             { todo.title }),
                        button("×", ariaLabel("Delete ${todo.title}"), onClick { todos.remove(todo); update() }),
                    )
                },
            ),
        ),
        p({ "${todos.count { !it.done }} left" }),
    ),
)

fun main() = runApp { render(::App) }
