# react-native-jsi-ixwebsocket

React Native JSI wrapper for Websockets.

On Android it used OKHttp library for websockets connection.

On IOS it uses native URLSessionWebSocketTask with was introduced in IOS 13

### Features
- High performance because everything is written in C++ (even the JS functions have C++ bodies!)
- iOS, Android support

## Installation

As library support only `"armeabi-v7a", "arm64-v8a"` architectures
You must set in `android app/build.gradle`

```
android {
//....

  splits {
      abi {
          reset()
          enable enableSeparateBuildPerCPUArchitecture
          universalApk false  // If true, also generate a universal APK
          include "armeabi-v7a", "arm64-v8a"
      }
  }

}
```

```sh
#add to package.json
"react-native-jsi-websockets":"sergeymild/react-native-jsi-websockets#1.0.0"
# after that make yarn install
# and npx pod-install
```

### Import
```typescript
import { jsiWebSockets } from 'react-native-jsi-websockets';
```

### Types
```typescript
export type JsiWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export enum JsiWebSocketCallback {
  onOpen = 'onOpen',
  onMessage = 'onMessage',
  onStateChange = 'onStateChange',
  onClose = 'onClose',
  onError = 'onError'
}
export type JsiWebSocketError = string;

export type ConnectParams = {
  endpoint: string
  headers?: Record<string, string>
}

type OnErrorCallback = (error: JsiWebSocketError) => void;
type OnMessageCallback = (message: string) => void;
type OnStateChangeCallback = (state: JsiWebSocketState) => void;
type OnOpenCallback = () => void;
type OnCloseCallback = () => void;
```

### Callbacks
```typescript
ixWebSocket.onError((reason: JsiWebSocketError) => {});
ixWebSocket.onOpen(() => {});
ixWebSocket.onMessage((message: string) => {});
ixWebSocket.onStateChange((message: JsiWebSocketState) => {});
ixWebSocket.onClose(() => {});
```

### Methods
```typescript
// unregister callbacks
ixWebSocket.unsubscribeAll();
ixWebSocket.unsubscribe(name: JsiWebSocketCallback)
// open connection
ixWebSocket.connect(params: ConnectParams)
// close connection
ixWebSocket.close();
// get current connection state will return JsiWebSocketState
ixWebSocket.state()
// send message
ixWebSocket.sendMessage(string)
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
