// Regras de conflito offline (usadas na sincronização com a nuvem).
// Cadastros: vence o mais recente CAMPO A CAMPO (_t guarda o timestamp de cada campo).
export function mergeRecord(a, b) {
  if (!a) return b;
  if (!b) return a;
  const out = { ...a, _t: { ...(a._t || {}) } };
  for (const k of Object.keys(b._t || {})) {
    if ((b._t[k] || 0) > (out._t[k] || 0)) { out[k] = b[k]; out._t[k] = b._t[k]; }
  }
  return out;
}
// Chamadas: as marcações de presença são mescladas ALUNO a ALUNO (vale a mais recente).
export function mergeAttendance(a, b) {
  const out = mergeRecord(a, b);
  const marks = { ...(a?.marks || {}) };
  for (const [id, m] of Object.entries(b?.marks || {})) {
    if (!marks[id] || m.t > marks[id].t) marks[id] = m;
  }
  return { ...out, marks };
}
export function mergeCollection(local = [], remote = [], fn = mergeRecord) {
  const map = new Map(local.map((r) => [r.id, r]));
  for (const r of remote) map.set(r.id, fn(map.get(r.id), r));
  return [...map.values()];
}
export function mergeData(local, remote) {
  const out = {};
  for (const k of Object.keys(local)) {
    out[k] = mergeCollection(local[k], remote?.[k], k === 'attendances' ? mergeAttendance : mergeRecord);
  }
  return out;
}
