# A Maré Vida
1. `npm install` e depois `npx expo install --fix` (ajusta as versões ao seu Expo)
2. `npx expo start` e abra no Expo Go (ou `npm run web` para abrir no navegador)

## Offline-first + sincronização
Os dados ficam sempre no aparelho (AsyncStorage), então o app funciona sem internet, inclusive na praia.
Quando há internet, o app sincroniza com o Firestore:

- ao abrir o app, quando a internet volta, alguns segundos depois de salvar algo e ao tocar na faixa de status no topo;
- cada rodada **baixa** os dados da nuvem, **junta** com os locais usando `src/utils/merge.js` e **envia** só o que mudou;
- cadastros: vence a alteração mais recente **campo a campo**; chamadas: vale a **última chamada salva, inteira**;
- nada é apagado, só desativado, então um aparelho offline não "ressuscita" registros;
- senha e sal do login local **não sobem** para a nuvem.

Arquivos: `src/sync/sync.js` (lógica, sem Firebase), `src/sync/firestoreRemote.js` (acesso ao Firestore),
`src/context/SyncContext.js` (quando sincronizar), `src/components/SyncBadge.js` (faixa de status).

### Como ligar
1. Crie um projeto no [console do Firebase](https://console.firebase.google.com) e ative o **Firestore**.
2. Em Configurações do projeto > Seus apps > Web, copie o `firebaseConfig` para `FIREBASE_CONFIG` em `src/config/config.js`.
3. Publique as regras de `firestore.rules`. Elas exigem login (Firebase Authentication, próxima etapa).
   Até lá, para testar, use o modo de teste do Firestore **apenas com dados fictícios**.

Sem `FIREBASE_CONFIG` o app continua 100% offline e a faixa mostra "Modo offline".
