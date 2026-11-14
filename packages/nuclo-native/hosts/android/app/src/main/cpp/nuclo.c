// The whole JS bridge: evaluate a script, hand op batches back to Kotlin, ask it for device data.
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

// __nuclo_device(name): Kotlin's device(name) JSON, "" when there is none.
static JSValue deviceValue(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    jbyteArray name = utf8(ctx, argv[0]);
    if (!name) return JS_EXCEPTION;
    jbyteArray json = (*env)->CallObjectMethod(env, activity, device, name);
    (*env)->DeleteLocalRef(env, name);
    jsize length = (*env)->GetArrayLength(env, json);
    jbyte *bytes = (*env)->GetByteArrayElements(env, json, NULL);
    JSValue result = JS_NewStringLen(ctx, (const char *)bytes, (size_t)length);
    (*env)->ReleaseByteArrayElements(env, json, bytes, JNI_ABORT);
    (*env)->DeleteLocalRef(env, json);
    return result;
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
        JS_FreeValue(context, global);
        jclass type = (*jni)->GetObjectClass(jni, thiz);
        receive = (*jni)->GetMethodID(jni, type, "receive", "([B)V");
        device = (*jni)->GetMethodID(jni, type, "device", "([B)[B");
    }
    // A widget callback fired by an op can re-enter here; restore on the way out.
    JNIEnv *outerEnv = env;
    jobject outerActivity = activity;
    env = jni;
    activity = thiz;

    // JS_Eval needs the source NUL-terminated.
    jsize length = (*jni)->GetArrayLength(jni, code);
    char *source = malloc((size_t)length + 1);
    (*jni)->GetByteArrayRegion(jni, code, 0, length, (jbyte *)source);
    source[length] = 0;
    report(JS_Eval(context, source, (size_t)length, "app.js", JS_EVAL_TYPE_GLOBAL));
    free(source);

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
