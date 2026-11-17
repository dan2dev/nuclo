package nuclo

internal actual fun platformRunApp(entry: () -> Unit) = nuclo.gtk.runGtkApp(entry)
