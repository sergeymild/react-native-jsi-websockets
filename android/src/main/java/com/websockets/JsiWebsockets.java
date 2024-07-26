package com.websockets;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.common.internal.DoNotStrip;
import com.facebook.jni.HybridData;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.EOFException;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

public class JsiWebsockets extends WebSocketListener {
  @DoNotStrip
  @SuppressWarnings("unused")
  HybridData mHybridData;

  @Nullable
  private WebSocket webSocket;
  private WsState state = WsState.CLOSED;

  @SuppressWarnings("JavaJniMissingFunction")
  public native HybridData initHybrid(long jsContext, CallInvokerHolderImpl jsCallInvokerHolder);

  @SuppressWarnings("JavaJniMissingFunction")
  public native void installJSIBindings();
  @SuppressWarnings("JavaJniMissingFunction")
  public native void onJavaWsMessage(String type, String string);
  @SuppressWarnings("JavaJniMissingFunction")
  public native void onJavaWsStateChange(String string);
  @SuppressWarnings("JavaJniMissingFunction")
  public native void onJavaWsError(String error);

  public boolean install(ReactApplicationContext context) {
    try {
      JavaScriptContextHolder jsContext = context.getJavaScriptContextHolder();
      CallInvokerHolder jsCallInvokerHolder = context.getCatalystInstance().getJSCallInvokerHolder();
      mHybridData = initHybrid(jsContext.get(), (CallInvokerHolderImpl) jsCallInvokerHolder);

      installJSIBindings();
      return true;
    } catch (Exception exception) {
      return false;
    }
  }

  @DoNotStrip
  void connect(String endpoint, String headers) throws JSONException {
    if (webSocket != null && state != WsState.CLOSED) return;
    Request.Builder builder = new Request.Builder().url(endpoint);
    if (!headers.isEmpty()) {
      JSONObject jsonHeaders = new JSONObject(headers);
      Iterator<String> keys = jsonHeaders.keys();
      while (keys.hasNext()) {
        String key = keys.next();
        builder.addHeader(key, jsonHeaders.getString(key));
      }
    }
    webSocket = new OkHttpClient().newWebSocket(builder.build(), this);
    state = WsState.CONNECTING;
    onJavaWsStateChange(state.toString());
  }

  @DoNotStrip
  void close() {
    if (webSocket == null || state == WsState.CLOSED) return;
    webSocket.close(1000, null);
  }

  @DoNotStrip
  void sendMessage(String message) {
    if (webSocket == null || state == WsState.CLOSED) return;
    webSocket.send(message);
  }

  @Override
  public void onClosed(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
    System.out.println("AndroidWS.closed");
    super.onClosed(webSocket, code, reason);
    state = WsState.CLOSED;
    webSocket = null;
    onJavaWsStateChange(state.toString());
    onJavaWsMessage("onClose", "");
  }

  @Override
  public void onClosing(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
    System.out.println("AndroidWS.onClosing");
    super.onClosing(webSocket, code, reason);
    state = WsState.CLOSING;
    onJavaWsStateChange(state.toString());
  }

  @Override
  public void onFailure(@NonNull WebSocket webSocket, @NonNull Throwable t, @Nullable Response response) {
    System.out.println("AndroidWS.onFailure");
    super.onFailure(webSocket, t, response);
    state = WsState.CLOSED;
    webSocket = null;
    if (t instanceof EOFException) {
      onJavaWsStateChange(state.toString());
      onJavaWsMessage("onClose", "");
      return;
    }
    onJavaWsStateChange(state.toString());
    onJavaWsError(t.getMessage());
  }

  @Override
  public void onMessage(@NonNull WebSocket webSocket, @NonNull String text) {
    super.onMessage(webSocket, text);
    onJavaWsMessage("onMessage", text);
  }

  @Override
  public void onMessage(@NonNull WebSocket webSocket, @NonNull ByteString bytes) {
    super.onMessage(webSocket, bytes);
    onJavaWsMessage("onMessage", bytes.string(StandardCharsets.UTF_8));
  }

  @Override
  public void onOpen(@NonNull WebSocket webSocket, @NonNull Response response) {
    System.out.println("AndroidWS.onOpen");
    super.onOpen(webSocket, response);
    state = WsState.OPEN;
    onJavaWsStateChange(state.toString());
    onJavaWsMessage("onOpen", "");
  }

  private enum WsState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
  }
}
