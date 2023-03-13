#include "JsiWebsockets.h"

#include <utility>
#include "iostream"

using namespace facebook;
using namespace facebook::jni;

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
    return facebook::jni::initialize(vm, [] {
        jsiWs::JsiWebsockets::registerNatives();
    });
};

namespace jsiWs {
    using TSelf = local_ref<HybridClass<JsiWebsockets>::jhybriddata>;

// JNI binding
    void JsiWebsockets::registerNatives() {
        registerHybrid({
               makeNativeMethod("initHybrid", JsiWebsockets::initHybrid),
               makeNativeMethod("installJSIBindings", JsiWebsockets::installJSIBindings),
               makeNativeMethod("onJavaWsMessage", JsiWebsockets::onJavaWsMessage),
               makeNativeMethod("onJavaWsStateChange", JsiWebsockets::onJavaWsStateChange),
               makeNativeMethod("onJavaWsError", JsiWebsockets::onJavaWsError),
       });
    }


    JsiWebsockets::JsiWebsockets(
            jni::alias_ref <JsiWebsockets::javaobject> jThis,
            jsi::Runtime *rt,
            std::shared_ptr <facebook::react::CallInvoker> jsCallInvoker)
            :javaPart_(jni::make_global(jThis)),
             runtime_(rt),
             jsCallInvoker_(std::move(jsCallInvoker)) {}

    void JsiWebsockets::onJavaWsMessage(jstring type, jstring message) {
        sendMessageToJs(make_local(type)->toStdString(), make_local(message)->toStdString());
    }

    void JsiWebsockets::onJavaWsStateChange(jstring state) {
        wsConnectionState_ = make_local(state)->toStdString();
        sendMessageToJs("onStateChange", wsConnectionState_);
    }

    void JsiWebsockets::onJavaWsError(jstring error) {
        sendMessageToJs("onError", make_local(error)->toStdString());
    }

    void JsiWebsockets::installJSIBindings() {
        auto connect = JSI_HOST_FUNCTION("connect", 2) {
            auto endpoint = args[0].asString(runtime).utf8(runtime);
            auto headers = args[1].asString(runtime).utf8(runtime);
            wsConnect(endpoint, headers);
            return jsi::Value::undefined();
        });

        auto close = JSI_HOST_FUNCTION("close", 0) {
            wsClose();
            return jsi::Value::undefined();
        });

        auto sendMessage = JSI_HOST_FUNCTION("sendMessage", 1) {
            auto result = wsSendMessage(args[0].asString(runtime).utf8(runtime));
            return {result};
        });

        auto state = JSI_HOST_FUNCTION("state", 0) {
            return jsi::String::createFromUtf8(runtime, wsState());
        });

        auto registerCallback = JSI_HOST_FUNCTION("registerCallback", 2) {
            auto name = args[0].asString(runtime).utf8(runtime);
            auto callback = args[1].asObject(runtime).asFunction(runtime);
            callbacks_[name] = std::make_shared<jsi::Function>(std::move(callback));
            return jsi::Value::undefined();
        });

        auto removeCallback = JSI_HOST_FUNCTION("removeCallback", 1) {
            auto name = args[0].asString(runtime).utf8(runtime);
            callbacks_.erase(name);
            return jsi::Value::undefined();
        });

        jsi::Object jsObject = jsi::Object(*runtime_);
        jsObject.setProperty(*runtime_, "registerCallback", std::move(registerCallback));
        jsObject.setProperty(*runtime_, "removeCallback", std::move(removeCallback));
        jsObject.setProperty(*runtime_, "state", std::move(state));
        jsObject.setProperty(*runtime_, "connect", std::move(connect));
        jsObject.setProperty(*runtime_, "close", std::move(close));
        jsObject.setProperty(*runtime_, "sendMessage", std::move(sendMessage));
        runtime_->global().setProperty(*runtime_, "jsiWebSockets", std::move(jsObject));
    }

// JNI init
    TSelf JsiWebsockets::initHybrid(
            alias_ref <jhybridobject> jThis,
            jlong jsContext,
            jni::alias_ref <facebook::react::CallInvokerHolder::javaobject>
            jsCallInvokerHolder) {

        auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
        return makeCxxInstance(jThis, (jsi::Runtime *) jsContext, jsCallInvoker);
    }

    void JsiWebsockets::wsConnect(const std::string& endpoint, const std::string& headers) {
        auto method = javaPart_->getClass()->getMethod<void(jni::local_ref<JString>, jni::local_ref<JString>)>("connect");
        method(javaPart_.get(), jni::make_jstring(endpoint), jni::make_jstring(headers));
    }

    void JsiWebsockets::wsClose() {
        auto method = javaPart_->getClass()->getMethod<void()>("close");
        method(javaPart_.get());
    }

    bool JsiWebsockets::wsSendMessage(const std::string& message) {
        auto method = javaPart_->getClass()->getMethod<void(jni::local_ref<JString>)>("sendMessage");
        method(javaPart_.get(), jni::make_jstring(message));
        return true;
    }

    std::string JsiWebsockets::wsState() {
        return wsConnectionState_;
    }

    void JsiWebsockets::sendMessageToJs(const std::string& messageType, const std::string& message) {
        jsCallInvoker_->invokeAsync([=]() {
            std::shared_ptr<jsi::Function> c = callbacks_[messageType];
            if (!c) return;
            c->call(*runtime_, message);
        });
    }
}
