plugins { kotlin("multiplatform") }

val example = providers.gradleProperty("example").get()
val exampleDir = rootProject.file("examples/$example")

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    macosArm64 {
        compilations["main"].cinterops.create("gtk") {
            defFile(rootProject.file("nuclo/src/nativeInterop/cinterop/gtk.def"))
            compilerOpts(pkgConfig("--cflags"))
        }
        binaries.executable { baseName = "nuclo-$example"; linkerOpts(pkgConfig("--libs")) }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonMain {
            kotlin.srcDir(exampleDir)
            kotlin.exclude("native/**")
            dependencies { implementation(project(":nuclo")) }
        }
        getByName("macosArm64Main") {
            // The GTK backend's own sources (the same files linuxMain compiles on Linux) and the example's Linux code.
            kotlin.srcDir(rootProject.file("nuclo/src/gtk/kotlin"))
            kotlin.srcDir(exampleDir.resolve("native/linux"))
        }
    }
}
