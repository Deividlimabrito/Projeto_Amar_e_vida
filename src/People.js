import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useStore } from './store';
import { Btn, Chip, Field, H, Row, C, sessionLabel } from './ui';

const KINDS = {
  students: { title: 'Aluno', fields: [['name', 'Nome'], ['guardian', 'Responsável'], ['phone', 'Telefone do responsável'], ['allergies', 'Alergias e medicações'], ['emergency', 'Contato de emergência'], ['notes', 'Observações importantes (diagnóstico, comunicação, o que ajuda)']] },
  teachers: { title: 'Professor', fields: [['name', 'Nome'], ['phone', 'Telefone']] },
  volunteers: { title: 'Voluntário', fields: [['name', 'Nome'], ['phone', 'Telefone']] },
};

export default function People() {
  const { data, save, setActive } = useStore();
  const [kind, setKind] = useState('students');
  const [f, setF] = useState(null);
  const K = KINDS[kind];

  if (f) {
    const submit = () => {
      const patch = {};
      K.fields.forEach(([k]) => (patch[k] = f[k] || ''));
      if (kind === 'students') patch.sessionIds = f.sessionIds;
      save(kind, f.id, patch, f.id ? {} : { active: true });
      setF(null);
    };
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <H>{f.id ? 'Editar' : 'Novo'} {K.title.toLowerCase()}</H>
        {K.fields.map(([k, l]) => (
          <Field key={k} label={l} value={f[k] || ''} onChangeText={(v) => setF({ ...f, [k]: v })} multiline={k === 'notes'} keyboardType={k === 'phone' ? 'phone-pad' : 'default'} />
        ))}
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
        {f.name ? <Btn t="Salvar" onPress={submit} /> : <Text style={{ color: C.mut }}>Informe o nome.</Text>}
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{p.name}</Text>
            <Text style={{ color: C.mut }}>{p.active ? (p.phone || 'Toque para editar') : 'Inativo'}</Text>
          </TouchableOpacity>
          <Btn t={p.active ? 'Desativar' : 'Reativar'} outline color={p.active ? C.no : C.ok} onPress={() => setActive(kind, p.id, !p.active)} />
        </View>
      ))}
    </ScrollView>
  );
}
