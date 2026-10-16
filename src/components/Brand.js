import React from 'react';
import { View, Text, Image } from 'react-native';
import { C } from './ui';

// Cabeçalho com a identidade (amarelo da logo) usado em Login e Visitante.
export default function Brand() {
  return (
    <View style={{ backgroundColor: C.sun, alignItems: 'center', paddingTop: 28, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
      <Image source={require('../../assets/logo.png')} style={{ width: 130, height: 130 }} resizeMode="contain" />
      <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink, marginTop: 6 }}>A Maré Vida</Text>
    </View>
  );
}

export const cardStyle = { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: -22, borderWidth: 1, borderColor: C.line };
