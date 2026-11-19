// The shell for Android: the activity of the host app (hosts/android of nuclo-native-ts) starts `main` of
// app.ns. The generated code is in the root package.
package dev.nuclo.app

import dev.nuclo.runtime.NucloActivity
import main as appMain

class MainActivity : NucloActivity({ appMain() })
