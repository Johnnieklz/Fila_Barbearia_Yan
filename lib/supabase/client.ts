"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso em componentes do lado do cliente ("use client").
 * Usa apenas a chave anônima (segura para expor no navegador); toda a
 * segurança real é garantida pelas políticas de RLS no banco.
 *
 * É uma função (não uma instância criada no carregamento do módulo) de
 * propósito: assim, se as variáveis de ambiente estiverem faltando, o erro
 * só acontece quando algo realmente tenta usar o Supabase — e pode ser
 * capturado e mostrado de forma amigável — em vez de quebrar o carregamento
 * de toda a página assim que o arquivo é importado.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (veja .env.example)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
