import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider } from './src/context/store';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from './src/screens/Login';
import ChangePassword from './src/screens/ChangePassword';
import Attendance from './src/screens/Attendance';
import People from './src/screens/People';
import History from './src/screens/History';
import Sessions from './src/screens/Sessions';
import { C } from './src/components/ui';

const TABS = [['Chamada', Attendance], ['Pessoas', People], ['Histórico', History], ['Sessões', Sessions]];

function Root() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState(0);
  const [changing, setChanging] = useState(false);

  // Sem login: só a tela de Login.
  if (!user) return <Login />;
  // Senha provisória: troca obrigatória antes de qualquer tela.
  if (user.mustChange) return <ChangePassword forced />;

  const Screen = TABS[tab][1];
  const confirmLogout = () =>
    Alert.alert('Sair', 'Deseja sair da conta?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }]);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sun, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Image source={require('./assets/logo.png')} style={{ width: 32, height: 32, marginRight: 8 }} />
        <Text numberOfLines={1} style={{ flex: 1, fontWeight: '800', color: C.ink }}>Olá, {(user.name || '').split(' ')[0]}</Text>
        <TouchableOpacity onPress={() => setChanging(true)} style={{ padding: 8 }}><Text style={{ fontWeight: '700', color: C.ink }}>Senha</Text></TouchableOpacity>
        <TouchableOpacity onPress={confirmLogout} style={{ padding: 8 }}><Text style={{ fontWeight: '700', color: C.ink }}>Sair</Text></TouchableOpacity>
      </View>
      {changing ? (
        <View style={{ flex: 1 }}><ChangePassword onClose={() => setChanging(false)} /></View>
      ) : (
        <>
          <View style={{ flex: 1 }}><Screen /></View>
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: C.line }}>
            {TABS.map(([n], i) => (
              <TouchableOpacity key={n} onPress={() => setTab(i)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderTopWidth: 3, borderColor: tab === i ? C.pri : 'transparent' }}>
                <Text style={{ fontWeight: '700', fontSize: 12, color: tab === i ? C.pri : C.mut }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <Root />
          </SafeAreaView>
        </AuthProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
