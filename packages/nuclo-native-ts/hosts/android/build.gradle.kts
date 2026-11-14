// AGP 9 compiles Kotlin itself (built-in Kotlin); the classpath entry only picks a newer Kotlin than AGP's default.
buildscript {
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.4.21")
    }
}
plugins {
    id("com.android.application") version "9.5.1" apply false
}
