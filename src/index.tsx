import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-jsi-ixwebsocket' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const JSIWebsockets = NativeModules.JSIWebsockets
  ? NativeModules.JSIWebsockets
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

JSIWebsockets.install();

export type JsiWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export enum JsiWebSocketCallback {
  onOpen = 'onOpen',
  onMessage = 'onMessage',
  onStateChange = 'onStateChange',
  onClose = 'onClose',
  onError = 'onError',
}
export type JsiWebSocketError = string;

export type ConnectParams = {
  endpoint: string;
  headers?: Record<string, string>;
};

type OnErrorCallback = (error: JsiWebSocketError) => void;
type OnMessageCallback = (message: string) => void;
type OnStateChangeCallback = (state: JsiWebSocketState) => void;
type OnOpenCallback = () => void;
type OnCloseCallback = () => void;

declare global {
  var jsiWebSockets: {
    connect: (data: { endpoint: string }) => void;
    close: () => void;
    state: () => JsiWebSocketState;
    sendMessage: (message: string) => boolean;
    onOpen: (callback: OnOpenCallback) => void;
    onMessage: (callback: OnMessageCallback) => void;
    onClose: (callback: OnCloseCallback) => void;
    onError: (callback: OnErrorCallback) => void;
    unsubscribe: (callback: JsiWebSocketCallback) => void;

    registerCallback: (name: JsiWebSocketCallback, callback: any) => void;
    removeCallback: (name: JsiWebSocketCallback) => void;
  };
}

class _ixWebSocket {
  static connect(params: ConnectParams) {
    if (Platform.OS === 'android') {
      global.jsiWebSockets.connect(
        params.endpoint,
        //@ts-ignore
        JSON.stringify(params.headers ?? {})
      );
      return;
    }
    global.jsiWebSockets.connect(params);
  }

  static close() {
    global.jsiWebSockets.close();
  }

  static state(): JsiWebSocketState {
    return global.jsiWebSockets.state();
  }

  static sendMessage(message: string): boolean {
    return global.jsiWebSockets.sendMessage(message);
  }

  static onOpen(callback: OnOpenCallback) {
    global.jsiWebSockets.registerCallback(
      JsiWebSocketCallback.onOpen,
      callback
    );
  }

  static onStateChange(callback: OnStateChangeCallback) {
    global.jsiWebSockets.registerCallback(
      JsiWebSocketCallback.onStateChange,
      callback
    );
  }

  static onMessage(callback: OnMessageCallback) {
    global.jsiWebSockets.registerCallback(
      JsiWebSocketCallback.onMessage,
      callback
    );
  }

  static onClose(callback: OnCloseCallback) {
    global.jsiWebSockets.registerCallback(
      JsiWebSocketCallback.onClose,
      callback
    );
  }

  static onError(callback: OnErrorCallback) {
    global.jsiWebSockets.registerCallback(
      JsiWebSocketCallback.onError,
      callback
    );
  }

  static unsubscribe(callback: JsiWebSocketCallback) {
    global.jsiWebSockets.removeCallback(callback);
  }

  static unsubscribeAll() {
    global.jsiWebSockets.removeCallback(JsiWebSocketCallback.onOpen);
    global.jsiWebSockets.removeCallback(JsiWebSocketCallback.onMessage);
    global.jsiWebSockets.removeCallback(JsiWebSocketCallback.onClose);
    global.jsiWebSockets.removeCallback(JsiWebSocketCallback.onError);
    global.jsiWebSockets.removeCallback(JsiWebSocketCallback.onStateChange);
  }
}

export { _ixWebSocket as jsiWebSockets };
