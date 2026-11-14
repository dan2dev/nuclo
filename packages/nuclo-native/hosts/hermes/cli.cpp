// Runs a bundle in the engine the Hermes hosts ship, on this machine: `nuclo-hermes <bundle.js|bundle.hbc>`.
// For the engine benchmarks (test/engine.bench.ts) and for trying a bundle without a device. The host here has no
// views: ops are dropped, timers fire at once in the order they are due, and __nuclo_device("heap") is the live JS
// heap in bytes after a collection.
#include "nuclo_hermes.h"

#include <cstdio>
#include <fstream>
#include <iterator>
#include <map>
#include <string>
#include <vector>

static NucloRuntime *runtime;
static std::multimap<double, int32_t> timers;
static double now;
static std::string reply;

int main(int argc, char **argv) {
    if (argc < 2) return fprintf(stderr, "usage: %s <bundle.js|bundle.hbc>\n", argv[0]), 2;
    std::ifstream file(argv[1], std::ios::binary);
    if (!file) return fprintf(stderr, "%s: cannot read\n", argv[1]), 2;
    std::vector<char> code((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    NucloHost host = {};
    host.ops = [](void *, const char *, size_t) {};
    host.device = [](void *, const char *name) -> const char * {
        if (std::string(name) != "heap") return "";
        reply = std::to_string(nuclo_heap(runtime, true));
        return reply.c_str();
    };
    host.timer = [](void *, int32_t id, double ms) { timers.emplace(now + ms, id); };
    host.log = [](void *, const char *message, bool error) { fprintf(error ? stderr : stdout, "%s\n", message); };
    runtime = nuclo_create(&host);

    bool ok = nuclo_evaluate(runtime, (const uint8_t *)code.data(), code.size(), argv[1]);
    while (ok && !timers.empty()) {
        auto next = timers.begin();
        now = next->first;
        int32_t id = next->second;
        timers.erase(next);
        nuclo_event(runtime, id, "timer", nullptr, false);
    }
    nuclo_destroy(runtime);
    return ok ? 0 : 1;
}
