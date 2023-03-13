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

export type JsiIXWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export enum JsiIXWebSocketCallback {
  onOpen = 'onOpen',
  onMessage = 'onMessage',
  onStateChange = 'onStateChange',
  onClose = 'onClose',
  onError = 'onError',
}
export type JsiIXWebSocketError = string;

export type ConnectParams = {
  endpoint: string;
  headers?: Record<string, string>;
};

type OnErrorCallback = (error: JsiIXWebSocketError) => void;
type OnMessageCallback = (message: string) => void;
type OnStateChangeCallback = (state: JsiIXWebSocketState) => void;
type OnOpenCallback = () => void;
type OnCloseCallback = () => void;

declare global {
  var jsiWebSockets: {
    connect: (data: { endpoint: string }) => void;
    close: () => void;
    state: () => JsiIXWebSocketState;
    sendMessage: (message: string) => boolean;
    onOpen: (callback: OnOpenCallback) => void;
    onMessage: (callback: OnMessageCallback) => void;
    onClose: (callback: OnCloseCallback) => void;
    onError: (callback: OnErrorCallback) => void;
    unsubscribe: (callback: JsiIXWebSocketCallback) => void;

    registerCallback: (name: JsiIXWebSocketCallback, callback: any) => void;
    removeCallback: (name: JsiIXWebSocketCallback) => void;
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

  static state(): JsiIXWebSocketState {
    return global.jsiWebSockets.state();
  }

  static sendMessage(message: string): boolean {
    return global.jsiWebSockets.sendMessage(message);
  }

  static onOpen(callback: OnOpenCallback) {
    global.jsiWebSockets.registerCallback(
      JsiIXWebSocketCallback.onOpen,
      callback
    );
  }

  static onStateChange(callback: OnStateChangeCallback) {
    global.jsiWebSockets.registerCallback(
      JsiIXWebSocketCallback.onStateChange,
      callback
    );
  }

  static onMessage(callback: OnMessageCallback) {
    global.jsiWebSockets.registerCallback(
      JsiIXWebSocketCallback.onMessage,
      callback
    );
  }

  static onClose(callback: OnCloseCallback) {
    global.jsiWebSockets.registerCallback(
      JsiIXWebSocketCallback.onClose,
      callback
    );
  }

  static onError(callback: OnErrorCallback) {
    global.jsiWebSockets.registerCallback(
      JsiIXWebSocketCallback.onError,
      callback
    );
  }

  static unsubscribe(callback: JsiIXWebSocketCallback) {
    global.jsiWebSockets.removeCallback(callback);
  }

  static unsubscribeAll() {
    global.jsiWebSockets.removeCallback(JsiIXWebSocketCallback.onOpen);
    global.jsiWebSockets.removeCallback(JsiIXWebSocketCallback.onMessage);
    global.jsiWebSockets.removeCallback(JsiIXWebSocketCallback.onClose);
    global.jsiWebSockets.removeCallback(JsiIXWebSocketCallback.onError);
    global.jsiWebSockets.removeCallback(JsiIXWebSocketCallback.onStateChange);
  }
}

export { _ixWebSocket as jsiWebSockets };
