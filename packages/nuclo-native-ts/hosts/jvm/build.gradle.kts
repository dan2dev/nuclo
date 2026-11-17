// Sources: NucloJs.kt (the runtime's JavaScript semantics, shared with Android), NucloJvm.kt (its JVM event loop)
// and the generated program, all in the folder `nucloSources`. org.json is what Android has built in.
plugins {
    kotlin("jvm") version "2.4.21"
    application
}

dependencies {
    implementation("org.json:json:20180813")
}

sourceSets["main"].kotlin.srcDir(providers.gradleProperty("nucloSources").get())
providers.gradleProperty("nucloBuildDir").orNull?.let { layout.buildDirectory.set(file(it)) }

application {
    mainClass.set("dev.nuclo.app.MainKt")
}
