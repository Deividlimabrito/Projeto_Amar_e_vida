import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useSync } from '../context/SyncContext';
import { C, hhmm } from './ui';

// Faixa fina abaixo do topo: mostra se as alterações já subiram para a nuvem.
// Tocar nela força uma sincronização.
export default function SyncBadge() {
  const { enabled, status, pending, lastSyncAt, error, sync } = useSync();
  const p = pending === 1 ? '1 alteração pendente' : `${pending} alterações pendentes`;

  let text; let color = C.mut; let bg = '#E6EEF0';
  if (!enabled) { text = 'Modo offline · dados só neste aparelho'; }
  else if (status === 'syncing') { text = 'Sincronizando…'; color = C.pri; }
  else if (status === 'offline') { text = pending ? `Sem internet · ${p}` : 'Sem internet · tudo salvo no aparelho'; color = '#8A6D00'; bg = '#FFF4D6'; }
  else if (status === 'error') { text = `Erro ao sincronizar · toque para tentar de novo`; color = C.no; bg = '#FBE4E3'; }
  else if (pending) { text = `⏳ ${p}`; color = '#8A6D00'; bg = '#FFF4D6'; }
  else { text = lastSyncAt ? `✓ Sincronizado às ${hhmm(lastSyncAt)}` : '✓ Sincronizado'; color = C.ok; bg = '#E3F4EC'; }

  return (
    <TouchableOpacity disabled={!enabled || status === 'syncing'} onPress={sync} accessibilityHint={error || undefined}
      style={{ backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 12 }}>
      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color, textAlign: 'center' }}>{text}</Text>
    </TouchableOpacity>
  );
}
