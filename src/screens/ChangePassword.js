import React, { useState } from 'react';
import { ScrollView, Text, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';
import { Btn, H, C } from '../components/ui';

// forced = primeiro login com senha provisória (não dá para pular).
export default function ChangePassword({ forced, onClose }) {
  const { changePassword, logout } = useAuth();
  const [cur, setCur] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = p1 && p2 && (forced || cur);
  const submit = async () => {
    setErr('');
    if (p1 !== p2) return setErr('As senhas não conferem.');
    setBusy(true);
    const e = await changePassword(p1, forced ? null : cur);
    setBusy(false);
    if (e) return setErr(e);
    Alert.alert('Senha alterada');
    onClose && onClose();
  };

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H>{forced ? 'Crie sua senha' : 'Alterar senha'}</H>
      {forced && <Text style={{ color: C.mut, marginBottom: 8 }}>Você entrou com uma senha provisória. Defina uma senha só sua para continuar.</Text>}
      {!forced && <PasswordField label="Senha atual" value={cur} onChangeText={setCur} />}
      <PasswordField label="Nova senha (mín. 6 caracteres)" value={p1} onChangeText={setP1} />
      <PasswordField label="Confirmar nova senha" value={p2} onChangeText={setP2} />
      {!!err && <Text style={{ color: C.no, marginVertical: 6 }}>{err}</Text>}
      <Btn t={busy ? 'Aguarde…' : 'Salvar nova senha'} disabled={!ready || busy} onPress={submit} />
      {forced ? <Btn t="Sair" outline onPress={logout} /> : <Btn t="Cancelar" outline onPress={onClose} />}
    </ScrollView>
  );
}
