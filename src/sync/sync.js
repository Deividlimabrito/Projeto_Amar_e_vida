// Sincronização offline-first: o app sempre grava no aparelho (AsyncStorage) e,
// quando há internet, junta os dados locais com os da nuvem usando as regras de merge.js.
// Este arquivo não conhece o Firebase: recebe um "remote" com pull() e push().
import { mergeData } from '../utils/merge';

export const COLLECTIONS = ['sessions', 'students', 'teachers', 'volunteers', 'attendances'];

// Credenciais do login local NÃO sobem para a nuvem (ficam só no aparelho).
// Quando o Firebase Authentication entrar, esses campos deixam de existir.
const PRIVATE_FIELDS = { teachers: ['salt', 'passHash', 'mustChange'] };

// Remove campos privados (e seus carimbos) e valores `undefined` (o Firestore não aceita).
export function toRemote(coll, rec) {
  const out = JSON.parse(JSON.stringify(rec));
  for (const k of PRIVATE_FIELDS[coll] || []) {
    delete out[k];
    if (out._t) delete out._t[k];
  }
  return out;
}

// Momento da última alteração de um registro (carimbos por campo ou savedAt da chamada).
export const lastChange = (rec) => Math.max(0, rec.savedAt || 0, ...Object.values(rec._t || {}));

// Quantos registros mudaram desde a última sincronização bem-sucedida.
export function countPending(data, since = 0) {
  let n = 0;
  for (const coll of COLLECTIONS) for (const rec of data?.[coll] || []) if (lastChange(rec) > since) n++;
  return n;
}

// JSON com chaves ordenadas: a nuvem pode devolver os campos em outra ordem.
const stable = (v) => {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
};

// Uma rodada completa: baixa → junta → envia só o que mudou.
// Devolve { merged, pulled, pushed, newest } — `merged` deve ser absorvido pelo store.
export async function syncOnce(local, remote) {
  const remoteData = await remote.pull(COLLECTIONS);
  const base = Object.fromEntries(COLLECTIONS.map((c) => [c, local?.[c] || []]));
  const merged = mergeData(base, remoteData);

  const changes = [];
  let newest = 0;
  for (const coll of COLLECTIONS) {
    const onCloud = new Map((remoteData[coll] || []).map((r) => [r.id, r]));
    for (const rec of merged[coll]) {
      newest = Math.max(newest, lastChange(rec));
      const up = toRemote(coll, rec);
      const cur = onCloud.get(rec.id);
      if (!cur || stable(cur) !== stable(up)) changes.push({ coll, rec: up });
    }
  }
  if (changes.length) await remote.push(changes);

  const pulled = COLLECTIONS.reduce((n, c) => n + (remoteData[c] || []).length, 0);
  return { merged, pulled, pushed: changes.length, newest };
}
