import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider } from './src/store';
import Attendance from './src/Attendance';
import People from './src/People';
import History from './src/History';
import Sessions from './src/Sessions';
import { C } from './src/ui';

const TABS = [['Chamada', Attendance], ['Pessoas', People], ['Histórico', History], ['Sessões', Sessions]];

export default function App() {
  const [tab, setTab] = useState(0);
  const Screen = TABS[tab][1];
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={{ flex: 1 }}><Screen /></View>
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: C.line }}>
            {TABS.map(([n], i) => (
              <TouchableOpacity key={n} onPress={() => setTab(i)} style={{ flex: 1, padding: 16, alignItems: 'center', borderTopWidth: 3, borderColor: tab === i ? C.pri : 'transparent' }}>
                <Text style={{ fontWeight: '700', color: tab === i ? C.pri : C.mut }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
