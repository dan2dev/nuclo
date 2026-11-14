// The bridge of nuclo_hermes.h, over JSI: the same file on every Hermes host.
#include "nuclo_hermes.h"

#include <hermes/hermes.h>
#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

#include <chrono>
#include <cstdio>
#include <cstring>
#include <memory>
#include <optional>
#include <string>

using namespace facebook;

struct NucloRuntime {
    NucloHost host;
    std::unique_ptr<jsi::Runtime> js;
    /** The bundle's __nuclo_event, looked up once: every event calls it. */
    std::optional<jsi::Function> event;
};

namespace {

void log(NucloRuntime *runtime, const std::string &message, bool error) {
    if (runtime->host.log) runtime->host.log(runtime->host.context, message.c_str(), error);
    else fprintf(stderr, "%s\n", message.c_str());
}

/** Runs `run`; an exception it lets out is logged, with its JS stack. False when there was one. */
template <typename Run>
bool guarded(NucloRuntime *runtime, Run run) {
    try {
        run(*runtime->js);
        // Promise reactions and queueMicrotask callbacks belong to the turn that queued them.
        runtime->js->drainMicrotasks();
        return true;
    } catch (const jsi::JSError &error) {
        log(runtime, error.getMessage() + "\n" + error.getStack(), true);
    } catch (const std::exception &error) {
        log(runtime, error.what(), true);
    }
    return false;
}

jsi::Value text(jsi::Runtime &js, const char *utf8) {
    return jsi::String::createFromUtf8(js, utf8 ? utf8 : "");
}

void define(jsi::Runtime &js, const jsi::Object &on, const char *name, unsigned params, jsi::HostFunctionType call) {
    on.setProperty(js, name, jsi::Function::createFromHostFunction(js, jsi::PropNameID::forAscii(js, name), params, std::move(call)));
}

/** console.log's arguments as one line: strings as they are, the rest as String() gives them. */
std::string line(jsi::Runtime &js, const jsi::Value *args, size_t count) {
    std::string out;
    for (size_t i = 0; i < count; i++) {
        if (i) out += ' ';
        out += args[i].toString(js).utf8(js);
    }
    return out;
}

} // namespace

NucloRuntime *nuclo_create(const NucloHost *host) {
    auto *runtime = new NucloRuntime{*host, nullptr, std::nullopt};
    auto config = ::hermes::vm::RuntimeConfig::Builder()
        .withMicrotaskQueue(true)
        // For a bundle run from source: let and const with a binding per block and per loop turn, and async
        // generators. Nuclo apps are plain modern JS, not Babel's ES5. Bytecode is compiled the same way
        // (scripts/hermes.ts: without it hermesc gives every closure in a loop the loop's last binding).
        .withES6BlockScoping(true)
        .withEnableAsyncGenerators(true);
    runtime->js = facebook::hermes::makeHermesRuntime(config.build());
    jsi::Runtime &js = *runtime->js;
    const NucloHost *h = &runtime->host;
    jsi::Object global = js.global();

    define(js, global, "__nuclo_host", 1, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t) {
        std::string json = args[0].getString(js).utf8(js);
        h->ops(h->context, json.c_str(), json.size());
        return jsi::Value::undefined();
    });
    define(js, global, "__nuclo_device", 1, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t) {
        return text(js, h->device ? h->device(h->context, args[0].toString(js).utf8(js).c_str()) : "");
    });
    // Always there: its presence is how JS knows to lay out (dom.ts, relayout).
    define(js, global, "__nuclo_measure", 2, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t) {
        return text(js, h->measure ? h->measure(h->context, (int32_t)args[0].asNumber(), args[1].asNumber()) : "0 0");
    });
    if (h->text_size) {
        define(js, global, "__nuclo_text_size", 5, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t) {
            return text(js, h->text_size(h->context, args[0].toString(js).utf8(js).c_str(), args[1].asNumber(), args[2].getBool(), args[3].getBool(), args[4].asNumber()));
        });
    }
    if (h->image_size) {
        define(js, global, "__nuclo_image_size", 1, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t) {
            return text(js, h->image_size(h->context, args[0].toString(js).utf8(js).c_str()));
        });
    }
    if (h->timer) {
        define(js, global, "__nuclo_timer", 2, [h](jsi::Runtime &, const jsi::Value &, const jsi::Value *args, size_t) {
            h->timer(h->context, (int32_t)args[0].asNumber(), args[1].asNumber());
            return jsi::Value::undefined();
        });
    }
    if (h->fetch) {
        define(js, global, "__nuclo_fetch", 5, [h](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t count) {
            std::string body = count > 4 && args[4].isString() ? args[4].getString(js).utf8(js) : "";
            h->fetch(h->context, (int32_t)args[0].asNumber(), args[1].toString(js).utf8(js).c_str(), args[2].toString(js).utf8(js).c_str(),
                     args[3].toString(js).utf8(js).c_str(), count > 4 && args[4].isString() ? body.c_str() : nullptr);
            return jsi::Value::undefined();
        });
    }

    // Hermes is the language alone: the console and the clock are the host's to give.
    jsi::Object console(js);
    for (const char *name : {"log", "info", "debug", "warn", "error"}) {
        bool error = name[0] == 'e' || name[0] == 'w';
        define(js, console, name, 0, [runtime, error](jsi::Runtime &js, const jsi::Value &, const jsi::Value *args, size_t count) {
            log(runtime, line(js, args, count), error);
            return jsi::Value::undefined();
        });
    }
    global.setProperty(js, "console", console);
    jsi::Object performance(js);
    auto started = std::chrono::steady_clock::now();
    define(js, performance, "now", 0, [started](jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t) {
        return jsi::Value(std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - started).count());
    });
    global.setProperty(js, "performance", performance);
    return runtime;
}

bool nuclo_evaluate(NucloRuntime *runtime, const uint8_t *code, size_t length, const char *name) {
    // Hermes reads bytecode where it lies, for as long as the runtime lives: the buffer is its own copy.
    auto buffer = std::make_shared<jsi::StringBuffer>(std::string((const char *)code, length));
    return guarded(runtime, [&](jsi::Runtime &js) { js.evaluateJavaScript(buffer, name); });
}

void nuclo_event(NucloRuntime *runtime, int32_t id, const char *type, const char *value, bool is_text) {
    guarded(runtime, [&](jsi::Runtime &js) {
        if (!runtime->event) {
            jsi::Value found = js.global().getProperty(js, "__nuclo_event");
            if (!found.isObject()) return;
            runtime->event = found.getObject(js).getFunction(js);
        }
        if (!value) runtime->event->call(js, id, text(js, type));
        else if (is_text) runtime->event->call(js, id, text(js, type), text(js, value));
        else runtime->event->call(js, id, text(js, type), jsi::Value::createFromJsonUtf8(js, (const uint8_t *)value, strlen(value)));
    });
}

void nuclo_device_changed(NucloRuntime *runtime, const char *name, const char *json) {
    guarded(runtime, [&](jsi::Runtime &js) {
        jsi::Value found = js.global().getProperty(js, "__nuclo_device_changed");
        if (found.isObject()) found.getObject(js).getFunction(js).call(js, text(js, name), text(js, json));
    });
}

size_t nuclo_heap(NucloRuntime *runtime, bool collect) {
    auto &stats = runtime->js->instrumentation();
    if (collect) stats.collectGarbage("nuclo_heap");
    auto info = stats.getHeapInfo(false);
    auto found = info.find("hermes_allocatedBytes");
    return found == info.end() ? 0 : (size_t)found->second;
}

void nuclo_destroy(NucloRuntime *runtime) {
    runtime->event.reset();
    runtime->js.reset();
    delete runtime;
}
