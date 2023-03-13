
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWebsocketsSpec.h"

@interface Websockets : NSObject <NativeWebsocketsSpec, NSURLSessionWebSocketDelegate>
#else
#import <React/RCTBridgeModule.h>

@interface Websockets :NSObject <RCTBridgeModule, NSURLSessionWebSocketDelegate>
#endif

@end
