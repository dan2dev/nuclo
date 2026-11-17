import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi

plugins {
    kotlin("multiplatform")
    id("com.android.kotlin.multiplatform.library")
}

val hostIsLinux = System.getProperty("os.name") == "Linux"

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    js(IR) { browser(); useEsModules() }
    androidLibrary { namespace = "dev.nuclo"; compileSdk = 37; minSdk = 30 }
    macosArm64()
    iosArm64()
    iosSimulatorArm64()
    mingwX64()
    // GTK's headers and libraries only exist on a Linux host. On macOS the same sources are built by :gtk-preview.
    if (hostIsLinux) linuxX64 {
        compilations["main"].cinterops.create("gtk") {
            defFile(file("src/nativeInterop/cinterop/gtk.def"))
            compilerOpts(pkgConfig("--cflags"))
        }
    }

    // uiMain: the core, shared by Android (JVM) and every Kotlin/Native target. withAndroidTarget() does not
    // match the AGP 9 library target, hence the name test.
    @OptIn(ExperimentalKotlinGradlePluginApi::class)
    applyDefaultHierarchyTemplate {
        common {
            group("ui") {
                withCompilations { it.target.name == "android" }
                group("native")
            }
        }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonTest.dependencies { implementation(kotlin("test")) }
        jsMain.dependencies { implementation(npm("nuclo", rootProject.file("../nuclo-core"))) }
        if (hostIsLinux) linuxMain { kotlin.srcDir("src/gtk/kotlin") }
    }
}
