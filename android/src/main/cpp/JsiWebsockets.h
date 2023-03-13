#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include "map"
#include "Macros.h"

namespace jsiWs {

    class JsiWebsockets : public facebook::jni::HybridClass<JsiWebsockets> {

    public:
        static constexpr auto kJavaDescriptor = "Lcom/websockets/JsiWebsockets;";

        static facebook::jni::local_ref<jhybriddata> initHybrid(
                facebook::jni::alias_ref<jhybridobject> jThis,
                jlong jsContext,
                facebook::jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder);

        static void registerNatives();

        void installJSIBindings();
        void onJavaWsMessage(jstring type, jstring message);
        void onJavaWsStateChange(jstring state);
        void onJavaWsError(jstring error);

    private:
        friend HybridBase;
        facebook::jsi::Runtime *runtime_;
        facebook::jni::global_ref<JsiWebsockets::javaobject> javaPart_;
        std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
        std::map<std::string, std::shared_ptr<facebook::jsi::Function>> callbacks_;
        std::string wsConnectionState_ = "CLOSED";

        void wsConnect(const std::string& endpoint, const std::string& headers);
        void wsClose();
        bool wsSendMessage(const std::string& message);
        std::string wsState();

        void sendMessageToJs(const std::string& messageType, const std::string& message);

        explicit JsiWebsockets(
                facebook::jni::alias_ref<JsiWebsockets::jhybridobject> jThis,
                facebook::jsi::Runtime *rt,
                std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker);
    };

}
