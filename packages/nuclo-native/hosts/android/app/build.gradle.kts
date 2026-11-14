plugins {
    id("com.android.application")
}

android {
    namespace = "dev.nuclo.host"
    compileSdk {
        version = release(37) {
            minorApiLevel = 2
        }
    }

    defaultConfig {
        applicationId = "dev.nuclo.host"
        minSdk {
            version = release(30)
        }
        targetSdk {
            version = release(37)
        }
        versionCode = 1
        versionName = "0.0.0"
    }

    // QuickJS and the JNI bridge, linked for 16 KB pages.
    ndkVersion = "30.0.16248370"
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
        }
    }

    // The bundled nuclo app (bun run build) ships as the asset app.js.
    sourceSets["main"].assets.directories += "../../../dist"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
