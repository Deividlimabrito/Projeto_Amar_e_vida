import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';
import Brand, { cardStyle } from '../components/Brand';
import { Btn, Field, Link, C } from '../components/ui';

const TITLES = { login: 'Área do Professor', first: 'Primeiro acesso', reset: 'Redefinir senha' };

export default function Login() {
  const { hasCredentials, login, registerFirst, resetWithCode } = useAuth();
  const [mode, setMode] = useState(hasCredentials ? 'login' : 'first');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (m) => { setMode(m); setErr(''); setInfo(''); setPass(''); setPass2(''); setCode(''); };

  const ready =
    mode === 'login' ? email.trim() && pass :
    mode === 'first' ? name.trim() && email.trim() && pass && pass2 && code :
    email.trim() && pass && pass2 && code;

  const run = async (fn) => {
    setErr(''); setInfo('');
    if (mode !== 'login' && pass !== pass2) return setErr('As senhas não conferem.');
    setBusy(true);
    const e = await fn();
    setBusy(false);
    if (e) return setErr(e);
    if (mode === 'reset') { go('login'); setInfo('Senha redefinida. Entre com a nova senha.'); }
  };

  const submit = () =>
    mode === 'login' ? run(() => login(email, pass)) :
    mode === 'first' ? run(() => registerFirst({ name, email, password: pass, code })) :
    run(() => resetWithCode({ email, code, password: pass }));

  const label = mode === 'login' ? 'Acessar Painel do Professor' : mode === 'first' ? 'Criar meu acesso' : 'Redefinir senha';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Brand />
        <View style={cardStyle}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 6 }}>{TITLES[mode]}</Text>
          {mode === 'first' && <Text style={{ color: C.mut, marginBottom: 6 }}>Primeiro acesso neste aparelho. O código é informado pela equipe.</Text>}
          {mode === 'reset' && <Text style={{ color: C.mut, marginBottom: 6 }}>Informe seu e-mail, o código e a nova senha.</Text>}

          {mode === 'first' && <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />}
          <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <PasswordField label={mode === 'reset' ? 'Nova senha (mín. 6 caracteres)' : mode === 'first' ? 'Senha (mín. 6 caracteres)' : 'Senha'} value={pass} onChangeText={setPass} />
          {mode !== 'login' && <PasswordField label="Confirmar senha" value={pass2} onChangeText={setPass2} />}
          {mode !== 'login' && <Field label="Código" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} />}

          {mode === 'login' && <Link t="Esqueci minha senha" onPress={() => go('reset')} />}
          {!!info && <Text style={{ color: C.ok, marginVertical: 6 }}>{info}</Text>}
          {!!err && <Text style={{ color: C.no, marginVertical: 6 }}>{err}</Text>}

          <Btn t={busy ? 'Aguarde…' : label} disabled={!ready || busy} onPress={submit} />
          {mode === 'reset' && <Link t="‹ Voltar ao login" onPress={() => go('login')} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
