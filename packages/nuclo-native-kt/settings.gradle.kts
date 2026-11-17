pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositories { google(); mavenCentral() } }
rootProject.name = "nuclo-native-kt"
include(":nuclo", ":app", ":android")
// The GTK backend on macOS, against Homebrew's GTK. On Linux the real linuxX64 target is used instead.
if (System.getProperty("os.name") == "Mac OS X") include(":gtk-preview")
