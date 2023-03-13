
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWebsocketsSpec.h"

@interface Websockets : NSObject <NativeWebsocketsSpec>
#else
#import <React/RCTBridgeModule.h>

@interface Websockets : NSObject <RCTBridgeModule>
#endif

@end
