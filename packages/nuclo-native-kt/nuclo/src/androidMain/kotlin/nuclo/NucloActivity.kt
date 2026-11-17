package nuclo

import android.os.Build
import android.os.Bundle
import android.window.OnBackInvokedDispatcher
import nuclo.core.Extras
import nuclo.host.Host

/** The Android entry: creates the backend, starts the host (which runs the app's entry), and sends system back to the router. */
open class NucloActivity(private val entry: () -> Unit) : android.app.Activity() {
    companion object {
        /** The running activity: what platform code needs a Context for. */
        lateinit var current: android.app.Activity
            private set
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        current = this
        Host.start(AndroidBackend(this), entry)
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
                val router = Extras.router
                if (router != null && router.canGoBack) router.back() else finish()
            }
        }
    }
}
