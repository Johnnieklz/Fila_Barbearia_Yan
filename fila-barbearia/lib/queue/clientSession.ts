"use client";

/**
 * Sessão anônima do cliente na fila.
 *
 * Estratégia (briefing seção 18): guardamos, por barbearia, o
 * `client_token` gerado ao entrar na fila e o `entry_id` retornado.
 * Isso permite:
 *   1. O cliente acompanhar sua posição sem login (recupera o entry_id).
 *   2. Evitar que o mesmo dispositivo entre na fila duas vezes por engano
 *      (se já existe uma sessão ativa para a barbearia, reaproveitamos).
 *
 * Usamos localStorage por simplicidade; se estiver indisponível (modo
 * privado, SSR), a função degrada graciosamente.
 */

interface StoredSession {
  entryId: string;
  clientToken: string;
  barbershopId: string;
  createdAt: string;
}

function storageKey(barbershopId: string) {
  return `fila:${barbershopId}`;
}

function isStorageAvailable() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getStoredSession(barbershopId: string): StoredSession | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(barbershopId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(storageKey(session.barbershopId), JSON.stringify(session));
  } catch {
    // Ignora silenciosamente — pior caso, o cliente perde a posição salva
    // e precisa entrar na fila novamente.
  }
}

export function clearSession(barbershopId: string) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(storageKey(barbershopId));
  } catch {
    // no-op
  }
}

export function generateClientToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback simples para navegadores muito antigos
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
