// The shell for iOS and macOS: the app delegate of the runtime starts `main` of app.ns. On iOS it is a
// UIApplicationDelegate (UIKit makes the window in its scene delegate); on macOS an NSApplicationDelegate
// whose static `main` runs the app. The generated code is the module NucloApp, the runtime the module Nuclo.
import Nuclo

@main final class AppDelegate: NucloAppDelegate {
  override func start() {
    NucloApp.main()
  }
}
