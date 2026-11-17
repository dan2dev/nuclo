// The Kotlin output on a plain JVM, without Android: the parity test (test/parity.test.ts) runs the language checks
// with it. Built with hosts/android's Gradle wrapper: `../android/gradlew -p . installDist --offline -PnucloSources=…`.
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}
rootProject.name = "nuclo-jvm"
