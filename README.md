# A Maré Vida
1. `npm install` e depois `npx expo install --fix` (ajusta as versões ao seu Expo)
2. `npx expo start` e abra no Expo Go
Dados ficam no aparelho (funciona offline). As regras de conflito estão prontas em `src/merge.js`;
falta ligar a sincronização com a nuvem (ex.: Supabase) usando `mergeData(local, remoto)`.
