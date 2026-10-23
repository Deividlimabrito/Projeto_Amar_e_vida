import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Share } from 'react-native';
import { useStore } from '../context/store';
import { useAuth } from '../context/AuthContext';
import { Btn, Chip, Field, H, Row, C, sessionLabel, maskPhone } from '../components/ui';
import { isEmail, normEmail } from '../utils/validators';

const KINDS = {
  students: { title: 'Aluno', fields: [['name', 'Nome'], ['guardian', 'Responsável'], ['phone', 'Telefone do responsável'], ['allergies', 'Alergias e medicações'], ['emergency', 'Outro contato, se o responsável não atender (opcional)'], ['notes', 'Observações importantes (diagnóstico, comunicação, o que ajuda)']] },
  teachers: { title: 'Professor', fields: [['name', 'Nome'], ['email', 'E-mail'], ['phone', 'Telefone']] },
  volunteers: { title: 'Voluntário', fields: [['name', 'Nome'], ['phone', 'Telefone']] },
};

// Mostra a senha provisória uma única vez, com opção de enviar pelo WhatsApp/mensagem.
const showPassword = (name, email, pass) =>
  Alert.alert(
    'Senha provisória',
    `${name} entra com:\nE-mail: ${email}\nSenha: ${pass}\n\nNo primeiro acesso, será pedida uma senha nova. Esta senha não aparece de novo.`,
    [
      { text: 'Compartilhar', onPress: () => Share.share({ message: `Acesso ao app A Maré Vida\nE-mail: ${email}\nSenha provisória: ${pass}\nNo primeiro acesso você vai criar uma senha nova.` }) },
      { text: 'OK' },
    ]
  );

export default function People() {
  const { data, save, setActive } = useStore();
  const { user, createTeacher, resetTeacherPassword } = useAuth();
  const [kind, setKind] = useState('students');
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const K = KINDS[kind];
  const isTeacher = kind === 'teachers';

  const toggleActive = (p) => {
    if (isTeacher && p.id === user.id) return Alert.alert('Não é possível', 'Você não pode desativar o seu próprio acesso.');
    setActive(kind, p.id, !p.active);
  };

  if (f) {
    const emailTaken = isTeacher && data.teachers.some((t) => t.id !== f.id && t.email && normEmail(t.email) === normEmail(f.email || ''));
    const ready = f.name && (!isTeacher || isEmail(f.email || '')) && !emailTaken;

    const submit = async () => {
      const patch = {};
      K.fields.forEach(([k]) => (patch[k] = f[k] || ''));
      if (isTeacher) patch.email = normEmail(f.email);
      if (kind === 'students') patch.sessionIds = f.sessionIds;

      if (isTeacher && !f.id) {
        setBusy(true);
        const r = await createTeacher({ name: f.name, email: f.email, phone: f.phone });
        setBusy(false);
        if (r.error) return Alert.alert('Não foi possível cadastrar', r.error);
        showPassword(f.name, normEmail(f.email), r.password);
        return setF(null);
      }
      save(kind, f.id, patch, f.id ? {} : { active: true });
      setF(null);
    };

    const reset = async () => {
      setBusy(true);
      const r = await resetTeacherPassword(f.id, { name: f.name, email: f.email, phone: f.phone || '' });
      setBusy(false);
      if (r.error) return Alert.alert('Não foi possível gerar a senha', r.error);
      showPassword(f.name, normEmail(f.email), r.password);
      setF(null);
    };

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <H>{f.id ? 'Editar' : 'Novo'} {K.title.toLowerCase()}</H>
        {K.fields.map(([k, l]) => (
          <Field key={k} label={l} value={f[k] || ''}
            onChangeText={(v) => setF({ ...f, [k]: k === 'phone' ? maskPhone(v.replace(/\D/g, '').slice(0, 11)) : v })}
            multiline={k === 'notes'}
            keyboardType={k === 'phone' ? 'phone-pad' : k === 'email' ? 'email-address' : 'default'}
            autoCapitalize={k === 'email' ? 'none' : undefined}
            autoCorrect={k === 'email' ? false : undefined}
            error={k === 'email' && emailTaken ? 'Já existe um professor com este e-mail.' : undefined} />
        ))}
        {isTeacher && !f.id && <Text style={{ color: C.mut, marginTop: 6 }}>O app gera uma senha provisória para o professor. Ele troca no primeiro acesso.</Text>}
        {kind === 'students' && (
          <>
            <Text style={{ color: C.mut, marginTop: 8 }}>Sessões do aluno</Text>
            <Row>
              {data.sessions.filter((s) => s.active).map((s) => (
                <Chip key={s.id} t={sessionLabel(s)} on={f.sessionIds.includes(s.id)}
                  onPress={() => setF({ ...f, sessionIds: f.sessionIds.includes(s.id) ? f.sessionIds.filter((x) => x !== s.id) : [...f.sessionIds, s.id] })} />
              ))}
            </Row>
          </>
        )}
        {ready
          ? <Btn t={busy ? 'Aguarde…' : isTeacher && !f.id ? 'Cadastrar e gerar senha' : 'Salvar'} disabled={busy} onPress={submit} />
          : <Text style={{ color: C.mut }}>{isTeacher ? 'Informe o nome e um e-mail válido (sem repetir).' : 'Informe o nome.'}</Text>}
        {isTeacher && f.id && f.id !== user.id && ready && (
          <Btn t={f.passHash ? 'Gerar nova senha provisória' : 'Criar acesso ao app'} outline disabled={busy} onPress={reset} />
        )}
        <Btn t="Cancelar" outline onPress={() => setF(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Row>{Object.entries(KINDS).map(([k, v]) => <Chip key={k} t={v.title + 's'} on={kind === k} onPress={() => setKind(k)} />)}</Row>
      <Btn t={`+ Novo ${K.title.toLowerCase()}`} onPress={() => setF({ sessionIds: [] })} />
      {data[kind].length === 0 && <Text style={{ color: C.mut, marginTop: 12 }}>Nenhum cadastro ainda.</Text>}
      {[...data[kind]].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((p) => (
        <View key={p.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8, opacity: p.active ? 1 : 0.5 }}>
          <TouchableOpacity onPress={() => setF({ ...p, sessionIds: p.sessionIds || [] })}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{p.name}{isTeacher && p.id === user.id ? ' (você)' : ''}</Text>
            <Text style={{ color: C.mut }}>
              {!p.active ? 'Inativo' : isTeacher ? `${p.email || 'Sem e-mail'}${p.passHash ? '' : ' · sem acesso ao app'}` : (p.phone || 'Toque para editar')}
            </Text>
          </TouchableOpacity>
          <Btn t={p.active ? 'Desativar' : 'Reativar'} outline color={p.active ? C.no : C.ok} onPress={() => toggleActive(p)} />
        </View>
      ))}
    </ScrollView>
  );
}
