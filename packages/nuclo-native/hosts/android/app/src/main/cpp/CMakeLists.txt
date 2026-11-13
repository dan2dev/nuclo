cmake_minimum_required(VERSION 3.22)
project(nuclo C)

include(FetchContent)
FetchContent_Declare(
    quickjs
    URL https://github.com/quickjs-ng/quickjs/releases/download/v0.18.0/quickjs-amalgam.zip
)
FetchContent_MakeAvailable(quickjs)

add_library(nuclo SHARED nuclo.c ${quickjs_SOURCE_DIR}/quickjs-amalgam.c)
target_include_directories(nuclo PRIVATE ${quickjs_SOURCE_DIR})
target_link_libraries(nuclo log m)
# Required by Android 15+ devices with 16 KB memory pages.
target_link_options(nuclo PRIVATE -Wl,-z,max-page-size=16384)
