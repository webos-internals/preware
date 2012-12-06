cmake_minimum_required(VERSION 2.8.7)

project(org.webosinternals.ipkgservice C)

include(webOS/webOS)
webos_modules_init(1 0 0 QUALIFIER RC2)
webos_component(2 0 0)

include(FindPkgConfig)

pkg_check_modules(GLIB2 REQUIRED glib-2.0)
include_directories(${GLIB2_INCLUDE_DIRS})
webos_add_compiler_flags(ALL ${GLIB2_CFLAGS})

pkg_check_modules(LUNASERVICE2 REQUIRED luna-service2)
include_directories(${LUNASERVICE2_INCLUDE_DIRS})
webos_add_compiler_flags(ALL ${LUNASERVICE2_CFLAGS})

pkg_check_modules(MJSON REQUIRED mjson)
include_directories(${MJSON_INCLUDE_DIRS})
webos_add_compiler_flags(ALL ${MJSON_CFLAGS})

webos_add_compiler_flags(ALL -Wall)
webos_add_linker_options(ALL --no-undefined)

add_definitions(-DVERSION=\"2.0.0\")

file(GLOB SOURCE_FILES src/*.c)

add_executable(org.webosinternals.ipkgservice ${SOURCE_FILES})
target_link_libraries(org.webosinternals.ipkgservice
    ${GLIB2_LDFLAGS} ${LUNASERVICE2_LDFLAGS} ${MJSON_LDFLAGS}
    rt pthread)

webos_build_daemon()
webos_build_system_bus_files()
