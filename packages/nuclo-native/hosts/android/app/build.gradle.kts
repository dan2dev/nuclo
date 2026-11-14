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
        // Hermes is built against the shared C++ runtime.
        externalNativeBuild {
            cmake {
                arguments += "-DANDROID_STL=c++_shared"
            }
        }
    }

    // The JNI bridge to Hermes (src/main/cpp, hosts/hermes), linked for 16 KB pages.
    ndkVersion = "30.0.16248370"
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
        }
    }
    // Hermes's library and headers reach CMake as a prefab package.
    buildFeatures {
        prefab = true
    }
    // fbjni ships the C++ runtime too: the same file as the NDK's.
    packaging {
        jniLibs {
            pickFirsts += "**/libc++_shared.so"
        }
    }

    // The bundled nuclo app (bun run build) ships as the asset app.js.
    sourceSets["main"].assets.directories += "../../../dist"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // The JS engine: the release build whatever the app's build type (the debug one is several times slower), at the
    // version scripts/hermes.ts fetches the headers of. It reaches the platform's Intl and Unicode through fbjni.
    implementation("com.facebook.hermes:hermes-android:260318099.0.7:release@aar")
    implementation("com.facebook.fbjni:fbjni:0.7.0")
    // fbjni's loader, which the host hands the system's (MainActivity's companion).
    implementation("com.facebook.soloader:nativeloader:0.10.5")
}
