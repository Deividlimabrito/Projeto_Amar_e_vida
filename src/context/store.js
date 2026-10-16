import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// v2: IDs fixos de sessão + chamada com autoria.
// Os dados de teste da v1 ficam de lado (não são apagados, só não são mais lidos).
const KEY = 'mare-vida-v2';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

// ID fixo e previsível: o mesmo em todos os aparelhos (ex.: surfe-qua-0900).
const DAY_SLUGS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
export const sessionId = (sport, day, start) =>
  `${sport.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${DAY_SLUGS[day]}-${start.replace(':', '')}`;

function seed() {
  const mk = (sport, day, start, end, note = '') => {
    const f = { sport, day, start, end, note, active: true };
    // _t = 1: qualquer edição real (que usa Date.now()) vence o valor inicial.
    return { id: sessionId(sport, day, start), ...f, _t: Object.fromEntries(Object.keys(f).map((k) => [k, 1])) };
  };
  const sessions = [
    mk('Surfe', 3, '09:00', '10:30'), mk('Surfe', 3, '14:30', '16:30'),
    mk('Surfe', 4, '14:30', '16:30', 'Turma atípica'),
    mk('Surfe', 5, '09:00', '10:30'), mk('Surfe', 5, '14:30', '16:30'),
    ...[1, 2, 3, 4, 5].map((d) => mk('Jiu-Jitsu', d, '19:00', '20:30')),
  ];
  return { sessions, students: [], teachers: [], volunteers: [], attendances: [] };
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      try { setData(raw ? JSON.parse(raw) : seed()); }
      catch { setData(seed()); }
    });
  }, []);
  useEffect(() => { if (data) AsyncStorage.setItem(KEY, JSON.stringify(data)); }, [data]);

  // Cria/atualiza um registro; cada campo recebe seu próprio carimbo de tempo. Devolve o id.
  const save = (coll, id, patch, extra = {}) => {
    const t = Date.now();
    const rid = id || uid();
    setData((d) => {
      const list = d[coll];
      const cur = list.find((r) => r.id === rid) || { id: rid, _t: {} };
      const next = { ...cur, ...extra, ...patch, _t: { ...cur._t } };
      for (const k of Object.keys(patch)) next._t[k] = t;
      const exists = list.some((r) => r.id === rid);
      return { ...d, [coll]: exists ? list.map((r) => (r.id === rid ? next : r)) : [...list, next] };
    });
    return rid;
  };
  // Nada é apagado: só marcado como inativo.
  const setActive = (coll, id, active) => save(coll, id, { active });
  if (!data) return null;
  return <Ctx.Provider value={{ data, save, setActive }}>{children}</Ctx.Provider>;
}
