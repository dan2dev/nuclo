// The GPUI host in a NativeActivity: libnuclo_gpui.so (cargo, see README) plus the bundle as assets.
plugins {
    id("com.android.application")
}

android {
    namespace = "dev.nuclo.gpui"
    compileSdk {
        version = release(37) {
            minorApiLevel = 2
        }
    }

    defaultConfig {
        applicationId = "dev.nuclo.gpui"
        minSdk {
            version = release(30)
        }
        targetSdk {
            version = release(37)
        }
        versionCode = 1
        versionName = "0.0.0"
        ndk { abiFilters += listOf("arm64-v8a") }
    }

    // The NDK cargo links libnuclo_gpui.so with (scripts/run.ts); AGP strips the library with it.
    ndkVersion = "30.0.16248370"

    sourceSets["main"].assets.directories += "../../../../dist"
    sourceSets["main"].jniLibs.directories += "build/jniLibs"
}
