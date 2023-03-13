#import "Websockets.h"
#import "Macros.h"
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
#import "map"


using namespace facebook;

@interface Websockets() {
    NSURLSessionWebSocketTask *wsTask;
    NSURLSession *openedSession;
    jsi::Runtime* _runtime;
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
    std::string wsState;
    std::map<std::string, std::shared_ptr<facebook::jsi::Function>> callbacks_;
}

@end

@implementation Websockets




RCT_EXPORT_MODULE(JSIWebsockets)

// Example method
// See // https://reactnative.dev/docs/native-modules-ios
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
    NSLog(@"Installing DateFormatter polyfill Bindings...");
    auto _bridge = [RCTBridge currentBridge];
    auto _cxxBridge = (RCTCxxBridge*)_bridge;
    if (_cxxBridge == nil) return @false;
    _runtime = (jsi::Runtime*) _cxxBridge.runtime;
    jsCallInvoker_ = _bridge.jsCallInvoker;
    if (_runtime == nil) return @false;
    wsState = "CLOSED";
    [self installJSIBindings];
    
    return @true;
}

-(void)installJSIBindings {
    auto connect = JSI_HOST_FUNCTION("connect", 1) {
       auto params = args[0].asObject(runtime);
       auto endpoint = params.getProperty(runtime,"endpoint").asString(runtime).utf8(runtime);
       jsi::Value rawHeaders = params.getProperty(runtime, "headers");

        NSMutableDictionary *jsonObject = [[NSMutableDictionary alloc] init];
       if (!rawHeaders.isUndefined() && !rawHeaders.isNull()) {
           auto headersObject = rawHeaders.asObject(runtime);
           jsi::Array propertyNames = headersObject.getPropertyNames(runtime);
           size_t size = propertyNames.size(runtime);


           for (size_t i = 0; i < size; i++) {
               jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
               jsi::String value = headersObject.getProperty(runtime, name).asString(runtime);

               auto nameString = [[NSString alloc] initWithCString:name.utf8(runtime).c_str() encoding:NSUTF8StringEncoding];
               auto valueString = [[NSString alloc] initWithCString:value.utf8(runtime).c_str() encoding:NSUTF8StringEncoding];

               [jsonObject setValue:valueString forKey:nameString];
           }
       }

        [self wsConnect:endpoint with:jsonObject];
       return jsi::Value::undefined();
    });

    auto close = JSI_HOST_FUNCTION("close", 0) {
        [self wsClose];
        return jsi::Value::undefined();
    });

    auto sendMessage = JSI_HOST_FUNCTION("sendMessage", 1) {
        auto result = [self wsSendMessage:args[0].asString(runtime).utf8(runtime)];
        return {result};
    });

    auto state = JSI_HOST_FUNCTION("state", 0) {
        return jsi::String::createFromUtf8(runtime, wsState);
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

    jsi::Object jsObject = jsi::Object(*_runtime);
    jsObject.setProperty(*_runtime, "registerCallback", std::move(registerCallback));
    jsObject.setProperty(*_runtime, "removeCallback", std::move(removeCallback));
    jsObject.setProperty(*_runtime, "state", std::move(state));
    jsObject.setProperty(*_runtime, "connect", std::move(connect));
    jsObject.setProperty(*_runtime, "close", std::move(close));
    jsObject.setProperty(*_runtime, "sendMessage", std::move(sendMessage));
    _runtime->global().setProperty(*_runtime, "jsiWebSockets", std::move(jsObject));
}

-(void)wsConnect:(std::string)endpoint with:(NSMutableDictionary*)headers {
    if (openedSession != NULL) return;
    auto config = [NSURLSessionConfiguration defaultSessionConfiguration];
    [config setHTTPAdditionalHeaders:headers];
    auto end = [[NSString alloc] initWithCString:endpoint.c_str() encoding:NSUTF8StringEncoding];
    auto queue = [[NSOperationQueue alloc]init];

    openedSession = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue: queue];
    @try {
        wsTask = [openedSession webSocketTaskWithURL:[[NSURL alloc]initWithString:end]];

        wsState = "CONNECTING";
        auto s = [[NSString alloc] initWithCString:wsState.c_str() encoding:NSUTF8StringEncoding];
        [self sendMessageToJs:@"onStateChange" with:s];

        [wsTask resume];
    } @catch(id anException) {
        NSLog(@"-----");
    }
}

-(void)startReceiveMessage {
    if (wsTask == nil || wsState != "OPEN") return;

    [wsTask receiveMessageWithCompletionHandler:^(NSURLSessionWebSocketMessage * _Nullable message, NSError * _Nullable error) {
        if (error != nil) {
            [self sendMessageToJs:@"onError" with:error.domain.description];
        } else if (message != nil) {
            if ([message type] == NSURLSessionWebSocketMessageTypeData) {
                NSString *m = [[NSString alloc] initWithData:[message data] encoding:NSUTF8StringEncoding];
                [self sendMessageToJs:@"onMessage" with:m];
                return;
            }
            [self sendMessageToJs:@"onMessage" with:[message string]];
        }
        [self startReceiveMessage];
    }];
}

-(BOOL)wsSendMessage:(std::string)message {
    if (wsTask == nil || wsState != "OPEN") {
        return false;
    }

    auto m = [[NSString alloc] initWithCString:message.c_str() encoding:NSUTF8StringEncoding];
    auto socketMessage = [[NSURLSessionWebSocketMessage alloc] initWithString:m];
    [wsTask sendMessage:socketMessage completionHandler:^(NSError * _Nullable error) {}];
    return true;
}

-(void)wsClose {
    if (wsTask != nil) {
        [wsTask cancelWithCloseCode:NSURLSessionWebSocketCloseCodeNormalClosure reason:nil];
    }
}

-(void) sendMessageToJs:(NSString *)messageType with:(NSString *) message {
    jsCallInvoker_->invokeAsync([=]() {
        auto type = [messageType UTF8String];
        std::shared_ptr<jsi::Function> c = callbacks_[type];
        if (!c) return;

        auto m = jsi::String::createFromUtf8(*_runtime, [message UTF8String]);
        c->call(*_runtime, m);
    });
}

-(void)gracefulClose {
    wsState = "CLOSE";
    auto s = [[NSString alloc] initWithCString:wsState.c_str() encoding:NSUTF8StringEncoding];
    [self sendMessageToJs:@"onStateChange" with:s];
    wsTask = nil;
    openedSession = nil;
    [openedSession finishTasksAndInvalidate];
}


- (void)URLSession:(NSURLSession *)session webSocketTask:(NSURLSessionWebSocketTask *)webSocketTask didOpenWithProtocol:(NSString *)protocol {

    wsState = "OPEN";
    auto s = [[NSString alloc] initWithCString:wsState.c_str() encoding:NSUTF8StringEncoding];
    [self sendMessageToJs:@"onStateChange" with:s];
    [self sendMessageToJs:@"onOpen" with:@""];
    [self startReceiveMessage];
}

- (void)URLSession:(NSURLSession *)session webSocketTask:(NSURLSessionWebSocketTask *)webSocketTask didCloseWithCode:(NSURLSessionWebSocketCloseCode)closeCode reason:(NSData *)reason {
    [self gracefulClose];
    [self sendMessageToJs:@"onClose" with:@""];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error {
    NSLog(@"didCompleteWithError %@", error.description);
    if (error.domain != NULL) {
        [self sendMessageToJs:@"onError" with:error.domain];
        [self gracefulClose];
    }
}

@end
