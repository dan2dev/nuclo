package nuclo

internal actual fun platformRunApp(entry: () -> Unit) {
    setUpPage()
    entry()
    HarnessWeb.startIfRequested()
}
