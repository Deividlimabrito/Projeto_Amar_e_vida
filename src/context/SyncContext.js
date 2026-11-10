import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useStore } from './store';
import { FIREBASE_CONFIG } from '../config/config';
import { syncOnce, countPending } from '../sync/sync';

// Quando sincroniza:
//  - ao abrir o app;
//  - quando a internet volta;
//  - alguns segundos depois de qualquer alteração salva;
//  - quando o professor toca no indicador do topo.
// Sem FIREBASE_CONFIG o app continua 100% offline e o indicador só mostra o que está pendente.

const LAST_SYNC_KEY = 'mare-vida-last-sync';
const DEBOUNCE_MS = 5000;

// Só carrega o Firebase quando ele estiver configurado.
const remote = FIREBASE_CONFIG ? require('../sync/firestoreRemote').createFirestoreRemote(FIREBASE_CONFIG) : null;

const Ctx = createContext(null);
export const useSync = () => useContext(Ctx);

export function SyncProvider({ children }) {
  const { data, absorb } = useStore();
  const [status, setStatus] = useState(remote ? 'idle' : 'off'); // off | idle | syncing | offline | error
  const [lastSyncAt, setLastSyncAt] = useState(null); // null = ainda carregando
  const [error, setError] = useState(null);
  const dataRef = useRef(data);
  const running = useRef(false);
  const again = useRef(false);
  dataRef.current = data;

  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((v) => setLastSyncAt(Number(v) || 0));
  }, []);

  const sync = useCallback(async () => {
    if (!remote) return;
    if (running.current) { again.current = true; return; } // uma rodada por vez
    running.current = true;
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected === false) { setStatus('offline'); return; }
      setStatus('syncing');
      const startedAt = Date.now();
      const { merged, newest } = await syncOnce(dataRef.current, remote);
      absorb(merged);
      // Usa o maior carimbo visto para não contar como "pendente" algo que veio da nuvem.
      const mark = Math.max(startedAt, newest);
      setLastSyncAt(mark);
      await AsyncStorage.setItem(LAST_SYNC_KEY, String(mark));
      setError(null);
      setStatus('idle');
    } catch (e) {
      setError(e?.message || String(e));
      setStatus('error');
    } finally {
      running.current = false;
      if (again.current) { again.current = false; sync(); }
    }
  }, [absorb]);

  // Ao abrir o app.
  useEffect(() => { if (lastSyncAt !== null) sync(); }, [lastSyncAt === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quando a internet volta.
  useEffect(() => {
    if (!remote) return undefined;
    let wasOffline = false;
    return NetInfo.addEventListener((s) => {
      const offline = s.isConnected === false;
      if (offline) setStatus('offline');
      else if (wasOffline) sync();
      wasOffline = offline;
    });
  }, [sync]);

  const pending = lastSyncAt === null ? 0 : countPending(data, lastSyncAt);

  // Depois de alterações salvas (espera alguns segundos para juntar várias em uma rodada).
  useEffect(() => {
    if (!remote || !pending) return undefined;
    const t = setTimeout(sync, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [data, pending, sync]);

  return <Ctx.Provider value={{ enabled: !!remote, status, pending, lastSyncAt, error, sync }}>{children}</Ctx.Provider>;
}
