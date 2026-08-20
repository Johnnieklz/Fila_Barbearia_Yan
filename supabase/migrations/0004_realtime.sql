-- ============================================================
-- FILA DE BARBEARIA — HABILITAR REALTIME
-- ============================================================
-- IMPORTANTE: o Supabase só emite eventos em tempo real (INSERT/UPDATE/
-- DELETE) para tabelas que estão explicitamente adicionadas à publicação
-- `supabase_realtime`. Sem isso, o app funciona normalmente, mas a tela
-- só atualiza quando o usuário recarrega o navegador manualmente — este
-- arquivo corrige exatamente esse problema.
--
-- Rode este script depois dos demais (0001, 0002, 0003).
-- Alternativa via painel: Database > Replication > marque "queue_entries"
-- e "barbershops" na publicação "supabase_realtime".
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'queue_entries'
  ) then
    alter publication supabase_realtime add table public.queue_entries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'barbershops'
  ) then
    alter publication supabase_realtime add table public.barbershops;
  end if;
end$$;

-- Garante que cada evento traga a linha completa (antes e depois da
-- mudança), necessário para alguns cenários de UPDATE/DELETE no Realtime.
alter table public.queue_entries replica identity full;
alter table public.barbershops replica identity full;
