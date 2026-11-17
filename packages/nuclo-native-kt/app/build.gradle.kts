plugins {
    kotlin("multiplatform")
    id("com.android.kotlin.multiplatform.library")
}

val example = providers.gradleProperty("example").get()
val exampleDir = rootProject.file("examples/$example")
val hostIsLinux = System.getProperty("os.name") == "Linux"

fun pkgConfig(flag: String): List<String> =
    providers.exec { commandLine("pkg-config", flag, "gtk4", "libadwaita-1") }.standardOutput.asText.get().trim().split(Regex("\\s+"))

kotlin {
    js(IR) { browser(); useEsModules(); binaries.executable() }
    androidLibrary { namespace = "dev.nuclo.example"; compileSdk = 37; minSdk = 30 }
    listOf(macosArm64(), iosArm64(), iosSimulatorArm64(), mingwX64()).forEach {
        it.binaries.executable { baseName = "nuclo-$example"; entryPoint = "app.main" }
    }
    if (hostIsLinux) linuxX64 {
        binaries.executable { baseName = "nuclo-$example"; entryPoint = "app.main"; linkerOpts(pkgConfig("--libs")) }
    }
    sourceSets {
        all { languageSettings { optIn("kotlinx.cinterop.ExperimentalForeignApi"); optIn("kotlinx.cinterop.BetaInteropApi") } }
        commonMain {
            // The example's own files (not its native/ folder: those belong to one target each).
            kotlin.srcDir(exampleDir)
            kotlin.exclude("native/**")
            dependencies { implementation(project(":nuclo")) }
        }
        jsMain { kotlin.srcDir(exampleDir.resolve("native/web")) }
        androidMain { kotlin.srcDir(exampleDir.resolve("native/android")) }
        iosMain { kotlin.srcDir(exampleDir.resolve("native/ios")) }
        macosMain { kotlin.srcDir(exampleDir.resolve("native/macos")) }
        mingwMain { kotlin.srcDir(exampleDir.resolve("native/windows")) }
        if (hostIsLinux) linuxMain { kotlin.srcDir(exampleDir.resolve("native/linux")) }
    }
}
