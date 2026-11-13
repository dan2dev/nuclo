plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.nuclo.host"
    compileSdk = 36

    defaultConfig {
        applicationId = "dev.nuclo.host"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "0.0.0"
    }

    // QuickJS and the JNI bridge, linked for 16 KB pages.
    ndkVersion = "27.1.12297006"
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
        }
    }

    // The bundled nuclo app (bun run build) ships as the asset app.js.
    sourceSets["main"].assets.srcDir("../../../dist")

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}
