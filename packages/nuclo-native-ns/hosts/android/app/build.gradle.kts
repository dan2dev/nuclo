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
        applicationId = "dev.nuclo.nativens"
        manifestPlaceholders["appLabel"] = providers.gradleProperty("nucloAppLabel").getOrElse("nuclo")
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

    // Release: optimized and shrunk (R8), signed with the debug key so it installs without setup.
    buildTypes {
        release {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_25
        targetCompatibility = JavaVersion.VERSION_25
    }
}

// nuclo-native-ns: Material 3 components (top app bar, navigation bar, dialogs, menus, bottom sheets, snackbars).
dependencies {
    implementation("com.google.android.material:material:1.14.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.2.0")
}
