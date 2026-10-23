import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../context/store';
import { useAuth } from '../context/AuthContext';
import { Btn, Chip, Field, H, Row, C, DAYS, sessionLabel, isoDate as iso, hhmm } from '../components/ui';
import { generateAttendancePDF } from '../utils/pdfGenerator';

export default function Attendance() {
  const { data, save } = useStore();
  const { user } = useAuth();
  const today = new Date();
  const date = iso(today);
  const todays = data.sessions.filter((s) => s.active && s.day === today.getDay()).sort((a, b) => a.start.localeCompare(b.start));
  const [sid, setSid] = useState(null);
  const [form, setForm] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const session = data.sessions.find((s) => s.id === (sid || (todays.length === 1 ? todays[0].id : null)));

  const open = (s) => {
    const ex = data.attendances.find((a) => a.id === `${s.id}_${date}`);
    setSid(s.id);
    setForm(ex ? { ...ex } : { start: s.start, end: s.end, teacherIds: [user.id], volunteerIds: [], marks: {} });
  };
  if (session && !form) open(session);

  if (!session) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <H>Chamada do Dia</H>
        <Text style={{ color: C.mut }}>{DAYS[today.getDay()]}, {date.split('-').reverse().join('/')}</Text>
        {todays.length === 0 && <Text style={{ marginTop: 16, color: C.ink }}>Não há sessões ativas para hoje. Cadastre em Sessões.</Text>}
        {todays.length > 1 && <Text style={{ marginTop: 12, color: C.ink }}>Qual sessão?</Text>}
        {todays.map((s) => <Btn key={s.id} t={`${s.sport} · ${s.start}–${s.end}${s.note ? ' · ' + s.note : ''}`} onPress={() => open(s)} />)}
      </ScrollView>
    );
  }
  if (!form) return null;

  const students = data.students.filter((s) => s.active && (s.sessionIds || []).includes(session.id)).sort((a, b) => a.name.localeCompare(b.name));
  const mark = (id, present) => setForm({ ...form, marks: { ...form.marks, [id]: { present, t: Date.now() } } });
  const toggle = (key, id) => setForm({ ...form, [key]: form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id] });
  const info = (s) => Alert.alert(s.name, [s.notes, s.allergies && `Alergias/medicações: ${s.allergies}`, (s.guardian || s.phone) && `Responsável: ${[s.guardian, s.phone].filter(Boolean).join(' · ')}`, s.emergency && `Outro contato: ${s.emergency}`].filter(Boolean).join('\n\n'));
  const present = students.filter((s) => form.marks[s.id]?.present).length;
  const byOther = !!form.savedAt && form.savedBy !== user.id;

  // Gera o PDF do que está na tela (alunos vinculados sem marcação saem como "Não marcado").
  const exportPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    await generateAttendancePDF({ session, attendance: { ...form, date }, data, students });
    setPdfBusy(false);
  };

  const doSave = () => {
    // A chamada da sessão/dia é UMA só: o que for salvo agora substitui a anterior por inteiro.
    save('attendances', `${session.id}_${date}`, {
      sessionId: session.id, date,
      start: form.start, end: form.end,
      teacherIds: form.teacherIds, volunteerIds: form.volunteerIds,
      marks: form.marks,
      savedBy: user.id, savedByName: user.name, savedAt: Date.now(),
    });
    Alert.alert('Chamada salva');
    setSid(null); setForm(null);
  };
  const finish = () => {
    if (!byOther) return doSave();
    Alert.alert('Substituir chamada?', `A chamada de ${form.savedByName} (${hhmm(form.savedAt)}) será substituída pela sua.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Substituir', style: 'destructive', onPress: doSave },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <H>{sessionLabel(session).replace(` · ${DAYS[session.day]}`, '')}</H>
      <Text style={{ color: C.mut }}>{present} presentes de {students.length}</Text>
      {!!form.savedAt && (
        <View style={{ backgroundColor: '#FFF4D6', borderRadius: 12, padding: 12, marginTop: 10 }}>
          <Text style={{ color: C.ink }}>
            {byOther
              ? `Chamada já feita por ${form.savedByName} às ${hhmm(form.savedAt)}. Se você salvar, ela será substituída.`
              : `Você já salvou esta chamada às ${hhmm(form.savedAt)}. Ao salvar de novo, ela será atualizada.`}
          </Text>
        </View>
      )}
      {students.length === 0 && <Text style={{ marginTop: 12 }}>Nenhum aluno vinculado a esta sessão. Vincule no cadastro do aluno.</Text>}
      {students.map((s) => {
        const m = form.marks[s.id];
        return (
          <View key={s.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 16, color: C.ink }}>{s.name}</Text>
            {(s.notes || s.allergies || s.emergency || s.guardian || s.phone) && <TouchableOpacity onPress={() => info(s)}><Text style={{ fontSize: 22, marginRight: 10 }}>ℹ️</Text></TouchableOpacity>}
            <TouchableOpacity onPress={() => mark(s.id, true)} style={{ padding: 10, borderRadius: 10, backgroundColor: m?.present === true ? C.ok : '#E6EEF0', marginRight: 6 }}><Text style={{ fontWeight: '800', color: m?.present === true ? '#fff' : C.mut }}>Presente</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => mark(s.id, false)} style={{ padding: 10, borderRadius: 10, backgroundColor: m?.present === false ? C.no : '#E6EEF0' }}><Text style={{ fontWeight: '800', color: m?.present === false ? '#fff' : C.mut }}>Falta</Text></TouchableOpacity>
          </View>
        );
      })}
      <Row style={{ marginTop: 12 }}>
        <View style={{ flex: 1, marginRight: 6 }}><Field label="Início da aula" value={form.start} onChangeText={(v) => setForm({ ...form, start: v })} /></View>
        <View style={{ flex: 1 }}><Field label="Fim da aula" value={form.end} onChangeText={(v) => setForm({ ...form, end: v })} /></View>
      </Row>
      <Text style={{ color: C.mut, marginTop: 8 }}>Professor(es)</Text>
      <Row>{data.teachers.filter((t) => t.active).map((t) => <Chip key={t.id} t={t.name} on={form.teacherIds.includes(t.id)} onPress={() => toggle('teacherIds', t.id)} />)}</Row>
      <Text style={{ color: C.mut, marginTop: 8 }}>Voluntário(s) presentes</Text>
      <Row>{data.volunteers.filter((t) => t.active).map((t) => <Chip key={t.id} t={t.name} on={form.volunteerIds.includes(t.id)} onPress={() => toggle('volunteerIds', t.id)} />)}</Row>
      <Btn t="Salvar chamada" onPress={finish} />
      <Btn t={pdfBusy ? 'Gerando PDF…' : 'Gerar PDF da chamada'} outline disabled={pdfBusy} onPress={exportPdf} />
      <Btn t="Voltar" outline onPress={() => { setSid(null); setForm(null); }} />
    </ScrollView>
  );
}
