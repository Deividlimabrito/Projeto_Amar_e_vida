import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useStore, sessionId } from '../context/store';
import { Btn, Chip, Field, H, Row, C, DAYS, SPORTS, sessionLabel } from '../components/ui';

export default function Sessions() {
  const { data, save, setActive } = useStore();
  const [f, setF] = useState(null); // formulário
  const set = (p) => setF({ ...f, ...p });

  if (f) {
    const editing = !!f.id;
    const toggleDay = (d) => set({ days: editing ? [d] : f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });
    const ok = f.sport && f.days.length && /^\d\d:\d\d$/.test(f.start) && /^\d\d:\d\d$/.test(f.end);
    const submit = () => {
      // Sessão nova ganha ID fixo (ex.: surfe-qua-0900), igual em todos os aparelhos.
      f.days.forEach((d) =>
        save('sessions', editing ? f.id : sessionId(f.sport, d, f.start), { sport: f.sport, day: d, start: f.start, end: f.end, note: f.note, ...(editing ? {} : { active: true }) })
      );
      setF(null);
    };
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <H>{editing ? 'Editar sessão' : 'Nova sessão'}</H>
        <Text style={{ color: C.mut }}>Esporte</Text>
        <Row>{SPORTS.map((s) => <Chip key={s} t={s} on={f.sport === s} onPress={() => set({ sport: s })} />)}</Row>
        <Text style={{ color: C.mut, marginTop: 8 }}>{editing ? 'Dia da semana' : 'Dias da semana (pode marcar vários)'}</Text>
        <Row>{DAYS.map((d, i) => <Chip key={d} t={d} on={f.days.includes(i)} onPress={() => toggleDay(i)} />)}</Row>
        <Field label="Início (HH:MM)" value={f.start} onChangeText={(v) => set({ start: v })} placeholder="09:00" keyboardType="numbers-and-punctuation" />
        <Field label="Fim (HH:MM)" value={f.end} onChangeText={(v) => set({ end: v })} placeholder="10:30" keyboardType="numbers-and-punctuation" />
        <Field label="Observação (opcional)" value={f.note} onChangeText={(v) => set({ note: v })} placeholder="Ex: turma atípica" />
        {ok ? <Btn t="Salvar sessão" onPress={submit} /> : <Text style={{ color: C.mut }}>Escolha esporte, dia(s) e horários no formato 09:00.</Text>}
        <Btn t="Cancelar" outline onPress={() => setF(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <H>Sessões</H>
      <Btn t="+ Nova sessão" onPress={() => setF({ sport: '', days: [], start: '', end: '', note: '' })} />
      {SPORTS.map((sp) => (
        <View key={sp}>
          <Text style={{ fontWeight: '800', color: C.pri, marginTop: 14, fontSize: 17 }}>{sp}</Text>
          {data.sessions
            .filter((s) => s.sport === sp)
            .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
            .map((s) => (
              <View key={s.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8, opacity: s.active ? 1 : 0.5 }}>
                <TouchableOpacity onPress={() => setF({ id: s.id, sport: s.sport, days: [s.day], start: s.start, end: s.end, note: s.note })}>
                  <Text style={{ color: C.ink, fontSize: 15 }}>{sessionLabel(s).replace(`${sp} · `, '')}</Text>
                  <Text style={{ color: C.mut }}>{s.active ? 'Toque para editar' : 'Desativada'}</Text>
                </TouchableOpacity>
                <Btn t={s.active ? 'Desativar' : 'Reativar'} outline color={s.active ? C.no : C.ok} onPress={() => setActive('sessions', s.id, !s.active)} />
              </View>
            ))}
        </View>
      ))}
      <Text style={{ color: C.mut, marginTop: 16 }}>Sessões desativadas somem da chamada, mas o histórico continua guardado.</Text>
    </ScrollView>
  );
}
