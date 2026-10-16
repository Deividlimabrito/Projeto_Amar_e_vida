import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useStore } from '../context/store';
import { Btn, Chip, H, Row, C, sessionLabel, hhmm } from '../components/ui';

export default function History() {
  const { data } = useStore();
  const [sid, setSid] = useState(null);
  const n = new Date();
  const [ym, setYm] = useState({ y: n.getFullYear(), m: n.getMonth() });
  const key = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}`;
  const shift = (d) => { const x = new Date(ym.y, ym.m + d, 1); setYm({ y: x.getFullYear(), m: x.getMonth() }); };
  const list = data.attendances.filter((a) => a.sessionId === sid && a.date.startsWith(key)).sort((a, b) => a.date.localeCompare(b.date));
  const name = (coll, ids = []) => ids.map((i) => data[coll].find((p) => p.id === i)?.name).filter(Boolean).join(', ') || '—';

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <H>Histórico</H>
      <Row>{data.sessions.map((s) => <Chip key={s.id} t={sessionLabel(s)} on={sid === s.id} onPress={() => setSid(s.id)} />)}</Row>
      {sid && (
        <>
          <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <Btn t="‹" outline onPress={() => shift(-1)} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{String(ym.m + 1).padStart(2, '0')}/{ym.y}</Text>
            <Btn t="›" outline onPress={() => shift(1)} />
          </Row>
          {list.length === 0 && <Text style={{ color: C.mut }}>Nenhuma chamada neste mês.</Text>}
          {list.map((a) => {
            const marks = Object.entries(a.marks || {});
            const nm = (id) => data.students.find((s) => s.id === id)?.name || '?';
            return (
              <View key={a.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8 }}>
                <Text style={{ fontWeight: '800', color: C.ink }}>{a.date.split('-').reverse().join('/')} · {a.start}–{a.end}</Text>
                <Text style={{ color: C.ok }}>Presentes ({marks.filter(([, m]) => m.present).length}): {marks.filter(([, m]) => m.present).map(([i]) => nm(i)).join(', ') || '—'}</Text>
                <Text style={{ color: C.no }}>Faltas: {marks.filter(([, m]) => !m.present).map(([i]) => nm(i)).join(', ') || '—'}</Text>
                <Text style={{ color: C.mut }}>Professor(es): {name('teachers', a.teacherIds)} · Voluntários: {name('volunteers', a.volunteerIds)}</Text>
                {!!a.savedAt && <Text style={{ color: C.mut }}>Chamada feita por {a.savedByName || '—'} às {hhmm(a.savedAt)}</Text>}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
