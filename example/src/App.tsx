import * as React from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { jsiWebSockets } from 'react-native-websockets';
import { useState } from 'react';

const endpoint = `wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self`;

export default function App() {
  const [value, setValue] = useState('');

  React.useEffect(() => {
    console.log('[App.state]', jsiWebSockets.state());
    jsiWebSockets.onError((reason) => {
      console.log('[😀App.onError]', reason);
    });

    jsiWebSockets.onOpen(() => {
      console.log('[😀App.onOpen]');
    });

    jsiWebSockets.onStateChange((state) => {
      console.log('[😀AndroidWS.js.onStateChange]', state);
    });

    jsiWebSockets.onMessage((message) => {
      console.log('[😀App.onMessage]', message);
    });

    jsiWebSockets.onClose(() => {
      console.log('[😀App.onClose]');
    });

    return () => {
      jsiWebSockets.close();
      jsiWebSockets.unsubscribeAll();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => jsiWebSockets.close()}
      >
        <Text>Close</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          jsiWebSockets.connect({
            endpoint,
          })
        }
      >
        <Text>Open</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('[App.]', jsiWebSockets.state())}
      >
        <Text>State</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('[App.]', jsiWebSockets.sendMessage(value))}
      >
        <Text>Send test</Text>
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={setValue}
        style={{ width: '100%', height: 50, backgroundColor: 'red' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  button: {
    height: 32,
    backgroundColor: 'gray',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 4,
    marginEnd: 16,
    marginBottom: 16,
  },
});
