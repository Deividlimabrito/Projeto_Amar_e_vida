import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { C } from './ui';

export default function PasswordField({ label, error, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginVertical: 5 }}>
      <Text style={{ color: C.mut, marginBottom: 3 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: error ? C.no : C.line }}>
        <TextInput {...rest} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} placeholderTextColor="#9BB" style={{ flex: 1, padding: 12, fontSize: 16, color: C.ink }} />
        <TouchableOpacity onPress={() => setShow(!show)} accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
          <Text style={{ color: C.pri, fontWeight: '700' }}>{show ? 'Ocultar' : 'Mostrar'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={{ color: C.no, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );
}
