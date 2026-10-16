import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useStore } from './store';
import { SCHOOL_CODE } from '../config/config';
import { isEmail, normEmail } from '../utils/validators';

// FASE OFFLINE: login guardado no aparelho (senha só como hash com sal).
// Quando o Firebase entrar, troque apenas o miolo deste arquivo; as telas continuam iguais.

const SESSION_KEY = 'mare-vida-session';
const ROUNDS = 500;
const MAX_FAILS = 5;
const LOCK_MS = 30000;

const hex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
const newSalt = () => hex(Crypto.getRandomBytes(16));

async function hashPassword(password, salt) {
  let h = `${salt}:${password}`;
  for (let i = 0; i < ROUNDS; i++) {
    h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, h + salt);
  }
  return h;
}
async function makeCredentials(password) {
  const salt = newSalt();
  return { salt, passHash: await hashPassword(password, salt) };
}
// Senha provisória de 6 caracteres, sem letras/números que se confundem (0/O, 1/l/I).
function provisional() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(Crypto.getRandomBytes(6)).map((b) => abc[b % abc.length]).join('');
}
const codeOk = (c = '') => c.trim().toLowerCase() === SCHOOL_CODE.toLowerCase();
const badPassword = (p = '') => (p.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' : null);

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const { data, save } = useStore();
  const [sessionId, setSessionId] = useState(undefined); // undefined = carregando
  const fails = useRef({ n: 0, until: 0 });

  useEffect(() => { AsyncStorage.getItem(SESSION_KEY).then((v) => setSessionId(v || null)); }, []);

  const user = data.teachers.find((t) => t.id === sessionId && t.active && t.passHash) || null;
  const hasCredentials = data.teachers.some((t) => t.active && t.passHash);
  const findByEmail = (email) => data.teachers.find((t) => t.email && normEmail(t.email) === normEmail(email));

  const locked = () => {
    const wait = fails.current.until - Date.now();
    return wait > 0 ? `Muitas tentativas. Aguarde ${Math.ceil(wait / 1000)}s.` : null;
  };
  const fail = () => {
    fails.current.n += 1;
    if (fails.current.n >= MAX_FAILS) fails.current = { n: 0, until: Date.now() + LOCK_MS };
  };
  const startSession = async (id) => { await AsyncStorage.setItem(SESSION_KEY, id); setSessionId(id); };

  // Todas as funções devolvem null (sucesso) ou um texto de erro.
  const login = async (email, password) => {
    const lock = locked(); if (lock) return lock;
    const t = findByEmail(email);
    if (!t || !t.passHash) { fail(); return 'E-mail ou senha incorretos.'; }
    if ((await hashPassword(password, t.salt)) !== t.passHash) { fail(); return 'E-mail ou senha incorretos.'; }
    if (!t.active) return 'Este acesso está desativado. Fale com outro professor.';
    fails.current.n = 0;
    await startSession(t.id);
    return null;
  };

  const logout = async () => { await AsyncStorage.removeItem(SESSION_KEY); setSessionId(null); };

  // Primeiro acesso do aparelho: exige o código.
  const registerFirst = async ({ name, email, password, code }) => {
    const lock = locked(); if (lock) return lock;
    if (hasCredentials) return 'Já existe professor neste aparelho. Entre com seu e-mail.';
    if (!codeOk(code)) { fail(); return 'Código incorreto.'; }
    if (!name.trim()) return 'Informe seu nome.';
    if (!isEmail(email)) return 'Informe um e-mail válido.';
    if (badPassword(password)) return badPassword(password);
    const cred = await makeCredentials(password);
    const id = save('teachers', undefined, { name: name.trim(), email: normEmail(email), phone: '', ...cred, mustChange: false }, { active: true });
    await startSession(id);
    return null;
  };

  // Esqueci a senha (fase offline): usa o código.
  const resetWithCode = async ({ email, code, password }) => {
    const lock = locked(); if (lock) return lock;
    if (!codeOk(code)) { fail(); return 'Código incorreto.'; }
    const t = findByEmail(email);
    if (!t || !t.active) return 'Nenhum professor ativo com este e-mail.';
    if (badPassword(password)) return badPassword(password);
    save('teachers', t.id, { ...(await makeCredentials(password)), mustChange: false });
    return null;
  };

  const changePassword = async (newPassword, currentPassword = null) => {
    if (!user) return 'Sessão expirada.';
    if (currentPassword !== null && (await hashPassword(currentPassword, user.salt)) !== user.passHash) return 'Senha atual incorreta.';
    if (badPassword(newPassword)) return badPassword(newPassword);
    save('teachers', user.id, { ...(await makeCredentials(newPassword)), mustChange: false });
    return null;
  };

  // Professor logado cadastra um colega. Devolve { password } (provisória) ou { error }.
  const createTeacher = async ({ name, email, phone }) => {
    if (!user) return { error: 'Sessão expirada.' };
    if (!name.trim()) return { error: 'Informe o nome.' };
    if (!isEmail(email)) return { error: 'Informe um e-mail válido.' };
    if (findByEmail(email)) return { error: 'Já existe um professor com este e-mail.' };
    const password = provisional();
    save('teachers', undefined, { name: name.trim(), email: normEmail(email), phone: phone || '', ...(await makeCredentials(password)), mustChange: true }, { active: true });
    return { password };
  };

  // Gera nova senha provisória (ou libera o acesso de um cadastro antigo sem login).
  // `patch` pode trazer name/email/phone editados no formulário.
  const resetTeacherPassword = async (id, patch = {}) => {
    if (!user) return { error: 'Sessão expirada.' };
    if (!isEmail(patch.email || '')) return { error: 'Informe um e-mail válido.' };
    const other = findByEmail(patch.email);
    if (other && other.id !== id) return { error: 'Já existe um professor com este e-mail.' };
    const password = provisional();
    save('teachers', id, { ...patch, email: normEmail(patch.email), ...(await makeCredentials(password)), mustChange: true });
    return { password };
  };

  if (sessionId === undefined) return null;
  return (
    <Ctx.Provider value={{ user, hasCredentials, login, logout, registerFirst, resetWithCode, changePassword, createTeacher, resetTeacherPassword }}>
      {children}
    </Ctx.Provider>
  );
}
