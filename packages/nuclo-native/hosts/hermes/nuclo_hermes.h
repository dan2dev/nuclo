// nuclo-native's JS engine: Hermes behind a C interface, so the Kotlin (JNI), Swift and C++ hosts share one bridge.
// It is the whole of src/host.ts: the calls JS makes on the host, and the two the host makes on JS.
//
// A runtime belongs to one thread, the host's JS thread: every function here is called there, and every host
// callback runs there, inside nuclo_evaluate, nuclo_event or nuclo_device_changed.
#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * What JS calls on the host. Strings are UTF-8 and NUL-terminated, the host's to read during the call only.
 * A returned string is the host's too: it stays valid until the host is called again. NULL reads as "".
 * `measure`, `text_size`, `image_size`, `timer`, `fetch` and `log` may be NULL: JS then sees no such call (host.ts).
 */
typedef struct NucloHost {
    void *context;
    /** __nuclo_host(json): one batch of ops. */
    void (*ops)(void *context, const char *json, size_t length);
    /** __nuclo_device(name): JSON, or "". */
    const char *(*device)(void *context, const char *name);
    /** __nuclo_measure(id, maxWidth): "w h". NULL answers "0 0": the host sizes by content instead. */
    const char *(*measure)(void *context, int32_t id, double max_width);
    /** __nuclo_text_size(text, size, bold, system, maxWidth): "w h". */
    const char *(*text_size)(void *context, const char *text, double size, bool bold, bool system, double max_width);
    /** __nuclo_image_size(src): "w h". */
    const char *(*image_size)(void *context, const char *src);
    /** __nuclo_timer(id, ms): the host answers once, `ms` later, with nuclo_event(id, "timer"). */
    void (*timer)(void *context, int32_t id, double ms);
    /**
     * __nuclo_fetch(id, method, url, headers, body): `headers` a JSON object, `body` NULL for none. The host answers
     * once with nuclo_event(id, "fetch", json), a string (src/fetch.ts).
     */
    void (*fetch)(void *context, int32_t id, const char *method, const char *url, const char *headers, const char *body);
    /** console.log and friends, and uncaught errors (`error`). NULL: stderr. */
    void (*log)(void *context, const char *message, bool error);
} NucloHost;

typedef struct NucloRuntime NucloRuntime;

/** A Hermes runtime with the host's calls as globals. The host struct is copied. */
NucloRuntime *nuclo_create(const NucloHost *host);

/** Runs a bundle: Hermes bytecode (hermesc) or JS source, which Hermes compiles first. False when it threw. */
bool nuclo_evaluate(NucloRuntime *runtime, const uint8_t *code, size_t length, const char *name);

/**
 * __nuclo_event(id, type, value): `value` NULL for none; else a JS string when `text`, or JSON (a number or boolean).
 */
void nuclo_event(NucloRuntime *runtime, int32_t id, const char *type, const char *value, bool text);

/** __nuclo_device_changed(name, json). */
void nuclo_device_changed(NucloRuntime *runtime, const char *name, const char *json);

/** The JS heap in use, in bytes, after a full collection when `collect`. */
size_t nuclo_heap(NucloRuntime *runtime, bool collect);

void nuclo_destroy(NucloRuntime *runtime);

#ifdef __cplusplus
}
#endif
