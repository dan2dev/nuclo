cmake_minimum_required(VERSION 3.22)
project(nuclo CXX)

# Hermes: libhermesvm.so is the app's Gradle dependency (through prefab); JSI's headers and jsi.cpp come from the
# same release, fetched by scripts/hermes.ts into the package's build/hermes. The two versions must be one: JSI's
# classes are the interface between them.
set(HERMES ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../build/hermes)
if(NOT EXISTS ${HERMES}/jsi.cpp)
    message(FATAL_ERROR "No Hermes release in ${HERMES}: run `bun scripts/hermes.ts` in nuclo-native first.")
endif()
find_package(hermes-engine REQUIRED CONFIG)
file(STRINGS ${HERMES}/VERSION HERMES_VERSION)
if(NOT hermes-engine_VERSION STREQUAL HERMES_VERSION)
    message(FATAL_ERROR "Hermes ${hermes-engine_VERSION} from Gradle, ${HERMES_VERSION} in ${HERMES}: make them the same (scripts/hermes.ts, app/build.gradle.kts).")
endif()

set(CMAKE_CXX_STANDARD 20)
add_compile_options(-fexceptions -frtti)
# 16 KB pages (Android 15+ devices): the NDK's default since r28, a flag before. A library not aligned for them puts
# the whole app in the slower page-size compatibility mode.
add_link_options(-Wl,-z,max-page-size=16384)

# JSI's own code: libhermesvm.so loads it from a libjsi.so (in a React Native app, React Native's).
add_library(jsi SHARED ${HERMES}/jsi.cpp)
target_include_directories(jsi PUBLIC ${HERMES}/include)

set(BRIDGE ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../hermes)
add_library(nuclo SHARED nuclo.cpp ${BRIDGE}/nuclo_hermes.cpp)
target_include_directories(nuclo PRIVATE ${BRIDGE})
target_link_libraries(nuclo jsi hermes-engine::hermesvm log)
