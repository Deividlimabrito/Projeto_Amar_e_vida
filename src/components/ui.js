import React from 'react';
import { Text, TouchableOpacity, TextInput, View } from 'react-native';
export const C = { bg: '#EEF5F7', pri: '#0B6E8A', ink: '#12303B', mut: '#6B8791', ok: '#2E9E6B', no: '#D9534F', card: '#fff', line: '#D5E3E8', sun: '#FDC93B' };
export const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const SPORTS = ['Jiu-Jitsu', 'Surfe'];
export const sessionLabel = (s) => `${s.sport} · ${DAYS[s.day]} · ${s.start}–${s.end}${s.note ? ' · ' + s.note : ''}`;

export const isoDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const hhmm = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export const Btn = ({ t, onPress, color = C.pri, outline, disabled }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress} style={{ opacity: disabled ? 0.45 : 1, backgroundColor: outline ? '#fff' : color, borderColor: color, borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: 'center', marginVertical: 4 }}>
    <Text style={{ color: outline ? color : '#fff', fontWeight: '700', fontSize: 16 }}>{t}</Text>
  </TouchableOpacity>
);
export const Link = ({ t, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, alignItems: 'center' }}>
    <Text style={{ color: C.pri, fontWeight: '700', fontSize: 15 }}>{t}</Text>
  </TouchableOpacity>
);
export const Chip = ({ t, on, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, margin: 3, backgroundColor: on ? C.pri : '#fff', borderWidth: 1, borderColor: on ? C.pri : C.line }}>
    <Text style={{ color: on ? '#fff' : C.ink, fontWeight: '600' }}>{t}</Text>
  </TouchableOpacity>
);
export const Field = ({ label, error, ...p }) => (
  <View style={{ marginVertical: 5 }}>
    <Text style={{ color: C.mut, marginBottom: 3 }}>{label}</Text>
    <TextInput {...p} placeholderTextColor="#9BB" style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: error ? C.no : C.line, padding: 12, fontSize: 16, color: C.ink, minHeight: p.multiline ? 80 : undefined }} />
    {error ? <Text style={{ color: C.no, marginTop: 3 }}>{error}</Text> : null}
  </View>
);
export const H = ({ children }) => <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, marginVertical: 10 }}>{children}</Text>;
export const Row = ({ children, style }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }, style]}>{children}</View>;

// Funções utilitárias de máscara reutilizáveis em toda a aplicação
export const maskPhone = (v) => {
  return v
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
};

export const maskCpf = (v) => {
  return v
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskCep = (v) => {
  return v
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2');
};
