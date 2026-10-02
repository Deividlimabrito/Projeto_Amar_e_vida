import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mare-vida-v1';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

function seed() {
  const t = Date.now();
  const mk = (sport, day, start, end, note = '') => {
    const f = { sport, day, start, end, note, active: true };
    return { id: uid(), ...f, _t: Object.fromEntries(Object.keys(f).map((k) => [k, t])) };
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
    AsyncStorage.getItem(KEY).then((raw) => setData(raw ? JSON.parse(raw) : seed()));
  }, []);
  useEffect(() => { if (data) AsyncStorage.setItem(KEY, JSON.stringify(data)); }, [data]);

  // Cria/atualiza um registro; cada campo recebe seu próprio carimbo de tempo.
  const save = (coll, id, patch, extra = {}) => {
    const t = Date.now();
    setData((d) => {
      const list = d[coll];
      const cur = list.find((r) => r.id === id) || { id: id || uid(), _t: {} };
      const next = { ...cur, ...extra, ...patch, _t: { ...cur._t } };
      for (const k of Object.keys(patch)) next._t[k] = t;
      const exists = list.some((r) => r.id === next.id);
      return { ...d, [coll]: exists ? list.map((r) => (r.id === next.id ? next : r)) : [...list, next] };
    });
  };
  // Nada é apagado: só marcado como inativo.
  const setActive = (coll, id, active) => save(coll, id, { active });
  if (!data) return null;
  return <Ctx.Provider value={{ data, save, setActive }}>{children}</Ctx.Provider>;
}
