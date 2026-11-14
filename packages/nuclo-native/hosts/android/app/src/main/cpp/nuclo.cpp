// The JNI side of the JS bridge: Hermes (hosts/hermes/nuclo_hermes.h) with Kotlin's MainActivity as its host.
// Strings cross JNI as UTF-8 bytes; JNI's own string calls use modified UTF-8.
#include <android/log.h>
#include <jni.h>

#include <cstring>
#include <string>

#include "nuclo_hermes.h"

namespace {

NucloRuntime *runtime;
// Valid only while evaluate(), event() or changed() is on the stack; everything runs on the host's JS thread
// (MainActivity.turn).
JNIEnv *env;
jobject activity;
jmethodID receive, device, timer, textSize, imageSize, fetch;
/** The last answer Kotlin gave: the bridge reads it before it calls again. */
std::string reply;

jbyteArray bytes(const char *text, size_t length) {
    jbyteArray array = env->NewByteArray((jsize)length);
    env->SetByteArrayRegion(array, 0, (jsize)length, (const jbyte *)text);
    return array;
}

jbyteArray bytes(const char *text) {
    return bytes(text, strlen(text));
}

/** A Java byte[] of UTF-8 as a string; "" for null (Kotlin threw: the exception shows when the turn returns). */
std::string string(JNIEnv *jni, jbyteArray array) {
    if (!array) return "";
    jsize length = jni->GetArrayLength(array);
    std::string out((size_t)length, '\0');
    jni->GetByteArrayRegion(array, 0, length, (jbyte *)out.data());
    return out;
}

/** Kotlin's answer to a call, kept in `reply`; frees the argument's and the answer's local references. */
const char *keep(jbyteArray argument, jobject result) {
    env->DeleteLocalRef(argument);
    reply = string(env, (jbyteArray)result);
    if (result) env->DeleteLocalRef(result);
    return reply.c_str();
}

const NucloHost host = {
    nullptr,
    // __nuclo_host(json): Kotlin's receive parses it, on this thread.
    [](void *, const char *json, size_t length) {
        jbyteArray batch = bytes(json, length);
        env->CallVoidMethod(activity, receive, batch);
        env->DeleteLocalRef(batch);
    },
    [](void *, const char *name) {
        jbyteArray key = bytes(name);
        return keep(key, env->CallObjectMethod(activity, device, key));
    },
    // Nothing is measured by node: the views are the UI thread's. Texts, buttons and images are sized by content
    // (below); the other leaves have the contract's sizes (layout.ts).
    nullptr,
    [](void *, const char *text, double size, bool bold, bool system, double maxWidth) {
        jbyteArray content = bytes(text);
        return keep(content, env->CallObjectMethod(activity, textSize, content, (jdouble)size, (jboolean)bold, (jboolean)system, (jdouble)maxWidth));
    },
    [](void *, const char *src) {
        jbyteArray path = bytes(src);
        return keep(path, env->CallObjectMethod(activity, imageSize, path));
    },
    [](void *, int32_t id, double ms) { env->CallVoidMethod(activity, timer, (jint)id, (jdouble)ms); },
    // __nuclo_fetch: Kotlin's fetch makes the request on a thread of its own.
    [](void *, int32_t id, const char *method, const char *url, const char *headers, const char *body) {
        jbyteArray parts[] = {bytes(method), bytes(url), bytes(headers), body ? bytes(body) : nullptr};
        env->CallVoidMethod(activity, fetch, (jint)id, parts[0], parts[1], parts[2], parts[3]);
        for (jbyteArray part : parts) if (part) env->DeleteLocalRef(part);
    },
    [](void *, const char *message, bool error) {
        __android_log_write(error ? ANDROID_LOG_ERROR : ANDROID_LOG_INFO, "nuclo", message);
    },
};

/** Sets whose turn it is for the calls back into Kotlin. A widget callback fired by an op can re-enter: restores. */
struct Turn {
    JNIEnv *outerEnv = env;
    jobject outerActivity = activity;
    Turn(JNIEnv *jni, jobject thiz) {
        env = jni;
        activity = thiz;
    }
    ~Turn() {
        env = outerEnv;
        activity = outerActivity;
    }
};

} // namespace

extern "C" {

/** Runs the bundle: Hermes bytecode (app.hbc) or source (app.js). */
JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_evaluate(JNIEnv *jni, jobject thiz, jbyteArray code) {
    Turn turn(jni, thiz);
    if (!runtime) {
        jclass type = jni->GetObjectClass(thiz);
        receive = jni->GetMethodID(type, "receive", "([B)V");
        device = jni->GetMethodID(type, "device", "([B)[B");
        timer = jni->GetMethodID(type, "timer", "(ID)V");
        textSize = jni->GetMethodID(type, "textSize", "([BDZZD)[B");
        imageSize = jni->GetMethodID(type, "imageSize", "([B)[B");
        fetch = jni->GetMethodID(type, "fetch", "(I[B[B[B[B)V");
        runtime = nuclo_create(&host);
    }
    jsize length = jni->GetArrayLength(code);
    jbyte *data = jni->GetByteArrayElements(code, nullptr);
    nuclo_evaluate(runtime, (const uint8_t *)data, (size_t)length, "app.js");
    jni->ReleaseByteArrayElements(code, data, JNI_ABORT);
}

/** __nuclo_event(id, type, value?): `value` is a string if `text`, else JSON. */
JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_event(JNIEnv *jni, jobject thiz, jint id, jbyteArray type, jbyteArray value, jboolean text) {
    if (!runtime) return;
    Turn turn(jni, thiz);
    std::string name = string(jni, type);
    std::string data = string(jni, value);
    nuclo_event(runtime, id, name.c_str(), value ? data.c_str() : nullptr, text);
}

/** __nuclo_device_changed(name, json). */
JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_changed(JNIEnv *jni, jobject thiz, jbyteArray name, jbyteArray json) {
    if (!runtime) return;
    Turn turn(jni, thiz);
    nuclo_device_changed(runtime, string(jni, name).c_str(), string(jni, json).c_str());
}

JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_close(JNIEnv *, jobject) {
    if (!runtime) return;
    nuclo_destroy(runtime);
    runtime = nullptr;
}

} // extern "C"
