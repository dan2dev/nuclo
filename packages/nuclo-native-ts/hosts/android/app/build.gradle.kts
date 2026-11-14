plugins {
    id("com.android.application")
}

android {
    namespace = "dev.nuclo.app"
    compileSdk {
        version = release(37) {
            minorApiLevel = 2
        }
    }

    defaultConfig {
        applicationId = "dev.nuclo.nativets"
        minSdk {
            version = release(30)
        }
        targetSdk {
            version = release(37)
        }
        versionCode = 1
        versionName = "0.0.0"
    }

    // The generated app and the runtime: plain Kotlin sources, no JavaScript engine, no native libraries.
    sourceSets["main"].kotlin.directories += providers.gradleProperty("nucloSources").get()

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
