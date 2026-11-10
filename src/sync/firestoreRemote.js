// Adaptador do Firestore para o sync.js. Cada coleção do app vira uma coleção no Firestore
// e cada registro vira um documento com o mesmo id (ex.: sessions/surfe-qua-0900).
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const BATCH_LIMIT = 400; // o Firestore aceita até 500 operações por lote

export function createFirestoreRemote(config) {
  const app = getApps()[0] || initializeApp(config);
  const db = getFirestore(app);

  return {
    async pull(colls) {
      const out = {};
      for (const c of colls) {
        const snap = await getDocs(collection(db, c));
        out[c] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
      return out;
    },
    async push(changes) {
      for (let i = 0; i < changes.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        for (const { coll, rec } of changes.slice(i, i + BATCH_LIMIT)) batch.set(doc(db, coll, rec.id), rec);
        await batch.commit();
      }
    },
  };
}
