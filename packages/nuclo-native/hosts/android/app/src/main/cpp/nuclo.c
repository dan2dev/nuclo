// The whole JS bridge: evaluate a script, and hand op batches back to Kotlin.
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

static JSValue host(JSContext *ctx, JSValueConst self, int argc, JSValueConst *argv) {
    size_t length;
    const char *json = JS_ToCStringLen(ctx, &length, argv[0]);
    if (!json) return JS_EXCEPTION;
    jbyteArray bytes = (*env)->NewByteArray(env, (jsize)length);
    (*env)->SetByteArrayRegion(env, bytes, 0, (jsize)length, (const jbyte *)json);
    JS_FreeCString(ctx, json);
    (*env)->CallVoidMethod(env, activity, receive, bytes);
    (*env)->DeleteLocalRef(env, bytes);
    return JS_UNDEFINED;
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
        JS_FreeValue(context, global);
        receive = (*jni)->GetMethodID(jni, (*jni)->GetObjectClass(jni, thiz), "receive", "([B)V");
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
