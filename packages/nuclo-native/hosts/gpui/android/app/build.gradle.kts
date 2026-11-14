// The GPUI host in a NativeActivity: libnuclo_gpui.so (cargo, see README) plus the bundle as assets.
plugins {
    id("com.android.application")
}

android {
    namespace = "dev.nuclo.gpui"
    compileSdk = 36

    defaultConfig {
        applicationId = "dev.nuclo.gpui"
        minSdk = 26 // Vulkan
        targetSdk = 34
        versionCode = 1
        versionName = "0.0.0"
        ndk { abiFilters += listOf("arm64-v8a") }
    }

    sourceSets["main"].assets.srcDir("../../../../dist")
    sourceSets["main"].jniLibs.srcDir("build/jniLibs")
}
