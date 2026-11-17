plugins { id("com.android.application") }

android {
    namespace = "dev.nuclo.app"
    compileSdk { version = release(37) { minorApiLevel = 2 } }
    defaultConfig {
        applicationId = "dev.nuclo.nativekt"
        minSdk { version = release(30) }
        targetSdk { version = release(37) }
        versionCode = 1
        versionName = "0.0.0"
    }
    buildTypes { release { isMinifyEnabled = true; signingConfig = signingConfigs.getByName("debug") } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}

dependencies {
    implementation(project(":nuclo"))
    implementation(project(":app"))
}
