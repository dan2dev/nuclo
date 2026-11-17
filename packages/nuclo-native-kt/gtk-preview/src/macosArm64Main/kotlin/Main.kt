import nuclo.gtk.runGtkApp

/** Runs the example on the GTK backend instead of AppKit. */
fun main() {
    nuclo.runAppOverride = ::runGtkApp
    app.main()
}
