// The whole JS bridge: evaluate a script, hand op batches back to Kotlin, ask it to measure text and for device data.
// Strings cross JNI as UTF-8 bytes; JNI's own string calls use modified UTF-8.
#include <android/log.h>
#include <jni.h>
#include <stdlib.h>

#include "quickjs.h"

static JSRuntime *runtime;
static JSContext *context;
// Valid only while evaluate() is on the stack; everything runs on the main thread.
static JNIEnv *env;
static jobject activity;
static jmethodID receive;
static jmethodID device;
static jmethodID measure;
static jmethodID textSize;
static jmethodID imageSize;

// A JS string as a Java byte[] of its UTF-8; NULL with a JS exception pending.
static jbyteArray utf8(JSContext *ctx, JSValueConst value) {
    size_t length;
    const char *text = JS_ToCStringLen(ctx, &length, value);
    if (!text) return NULL;
    jbyteArray bytes = (*env)->NewByteArray(env, (jsize)length);
    (*env)->SetByteArrayRegion(env, bytes, 0, (jsize)length, (const jbyte *)text);
    JS_FreeCString(ctx, text);
    return bytes;
}

static JSValue host(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    jbyteArray bytes = utf8(ctx, argv[0]);
    if (!bytes) return JS_EXCEPTION;
    (*env)->CallVoidMethod(env, activity, receive, bytes);
    (*env)->DeleteLocalRef(env, bytes);
    return JS_UNDEFINED;
}

// A Java byte[] of UTF-8 as a JS string; frees the local reference.
static JSValue string(JSContext *ctx, jbyteArray bytes) {
    jsize length = (*env)->GetArrayLength(env, bytes);
    jbyte *data = (*env)->GetByteArrayElements(env, bytes, NULL);
    JSValue result = JS_NewStringLen(ctx, (const char *)data, (size_t)length);
    (*env)->ReleaseByteArrayElements(env, bytes, data, JNI_ABORT);
    (*env)->DeleteLocalRef(env, bytes);
    return result;
}

// __nuclo_device(name): Kotlin's device(name) JSON, "" when there is none.
static JSValue deviceValue(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    jbyteArray name = utf8(ctx, argv[0]);
    if (!name) return JS_EXCEPTION;
    jbyteArray json = (*env)->CallObjectMethod(env, activity, device, name);
    (*env)->DeleteLocalRef(env, name);
    return string(ctx, json);
}

// __nuclo_measure(id, maxWidth): Kotlin's measure(id, maxWidth), "w h" (layout.ts).
static JSValue measureValue(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    int32_t id;
    double maxWidth;
    if (JS_ToInt32(ctx, &id, argv[0]) || JS_ToFloat64(ctx, &maxWidth, argv[1])) return JS_EXCEPTION;
    return string(ctx, (*env)->CallObjectMethod(env, activity, measure, (jint)id, (jdouble)maxWidth));
}

// __nuclo_text_size(text, size, bold, system, maxWidth): Kotlin's textSize, "w h" (host.ts).
static JSValue textSizeValue(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    double size, maxWidth;
    if (JS_ToFloat64(ctx, &size, argv[1]) || JS_ToFloat64(ctx, &maxWidth, argv[4])) return JS_EXCEPTION;
    jbyteArray text = utf8(ctx, argv[0]);
    if (!text) return JS_EXCEPTION;
    jbyteArray reply = (*env)->CallObjectMethod(env, activity, textSize, text, (jdouble)size,
        (jboolean)JS_ToBool(ctx, argv[2]), (jboolean)JS_ToBool(ctx, argv[3]), (jdouble)maxWidth);
    (*env)->DeleteLocalRef(env, text);
    return string(ctx, reply);
}

// __nuclo_image_size(src): Kotlin's imageSize, "w h".
static JSValue imageSizeValue(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    jbyteArray src = utf8(ctx, argv[0]);
    if (!src) return JS_EXCEPTION;
    jbyteArray reply = (*env)->CallObjectMethod(env, activity, imageSize, src);
    (*env)->DeleteLocalRef(env, src);
    return string(ctx, reply);
}

// A Java byte[] as a NUL-terminated copy (JS_Eval and JS_ParseJSON need one); the caller frees it.
static char *copy(JNIEnv *jni, jbyteArray bytes, jsize *length) {
    *length = (*jni)->GetArrayLength(jni, bytes);
    char *text = malloc((size_t)*length + 1);
    (*jni)->GetByteArrayRegion(jni, bytes, 0, *length, (jbyte *)text);
    text[*length] = 0;
    return text;
}

static void report(JSValue result) {
    if (JS_IsException(result)) {
        JSValue error = JS_GetException(context);
        JSValue stack = JS_GetPropertyStr(context, error, "stack");
        const char *message = JS_ToCString(context, error);
        const char *trace = JS_ToCString(context, stack);
        __android_log_print(ANDROID_LOG_ERROR, "nuclo", "%s\n%s", message ? message : "", trace ? trace : "");
        JS_FreeCString(context, message);
        JS_FreeCString(context, trace);
        JS_FreeValue(context, stack);
        JS_FreeValue(context, error);
    }
    JS_FreeValue(context, result);
}

JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_evaluate(JNIEnv *jni, jobject thiz, jbyteArray code) {
    if (!context) {
        runtime = JS_NewRuntime();
        context = JS_NewContext(runtime);
        JSValue global = JS_GetGlobalObject(context);
        JS_SetPropertyStr(context, global, "__nuclo_host", JS_NewCFunction(context, host, "__nuclo_host", 1));
        JS_SetPropertyStr(context, global, "__nuclo_device", JS_NewCFunction(context, deviceValue, "__nuclo_device", 1));
        JS_SetPropertyStr(context, global, "__nuclo_measure", JS_NewCFunction(context, measureValue, "__nuclo_measure", 2));
        JS_SetPropertyStr(context, global, "__nuclo_text_size", JS_NewCFunction(context, textSizeValue, "__nuclo_text_size", 5));
        JS_SetPropertyStr(context, global, "__nuclo_image_size", JS_NewCFunction(context, imageSizeValue, "__nuclo_image_size", 1));
        JS_FreeValue(context, global);
        jclass type = (*jni)->GetObjectClass(jni, thiz);
        receive = (*jni)->GetMethodID(jni, type, "receive", "([B)V");
        device = (*jni)->GetMethodID(jni, type, "device", "([B)[B");
        measure = (*jni)->GetMethodID(jni, type, "measure", "(ID)[B");
        textSize = (*jni)->GetMethodID(jni, type, "textSize", "([BDZZD)[B");
        imageSize = (*jni)->GetMethodID(jni, type, "imageSize", "([B)[B");
    }
    // A widget callback fired by an op can re-enter here; restore on the way out.
    JNIEnv *outerEnv = env;
    jobject outerActivity = activity;
    env = jni;
    activity = thiz;

    jsize length;
    char *source = copy(jni, code, &length);
    report(JS_Eval(context, source, (size_t)length, "app.js", JS_EVAL_TYPE_GLOBAL));
    free(source);

    JSContext *job;
    while (JS_ExecutePendingJob(runtime, &job) > 0) {}

    env = outerEnv;
    activity = outerActivity;
}

// __nuclo_event(id, type, value?): a call, not a script to compile. `value` is a string if `text`, else JSON.
JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_event(JNIEnv *jni, jobject thiz, jint id, jbyteArray type, jbyteArray value, jboolean text) {
    if (!context) return;
    JNIEnv *outerEnv = env;
    jobject outerActivity = activity;
    env = jni;
    activity = thiz;

    JSValue global = JS_GetGlobalObject(context);
    JSValue function = JS_GetPropertyStr(context, global, "__nuclo_event");
    JSValue args[3];
    int argc = 2;
    jsize length;
    char *name = copy(jni, type, &length);
    args[0] = JS_NewInt32(context, id);
    args[1] = JS_NewStringLen(context, name, (size_t)length);
    free(name);
    if (value) {
        char *data = copy(jni, value, &length);
        args[argc++] = text ? JS_NewStringLen(context, data, (size_t)length) : JS_ParseJSON(context, data, (size_t)length, "value");
        free(data);
    }
    report(JS_Call(context, function, global, argc, args));
    for (int i = 0; i < argc; i++) JS_FreeValue(context, args[i]);
    JS_FreeValue(context, function);
    JS_FreeValue(context, global);

    JSContext *job;
    while (JS_ExecutePendingJob(runtime, &job) > 0) {}

    env = outerEnv;
    activity = outerActivity;
}

JNIEXPORT void JNICALL
Java_dev_nuclo_host_MainActivity_close(JNIEnv *jni, jobject thiz) {
    if (!context) return;
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
    context = NULL;
    runtime = NULL;
}
