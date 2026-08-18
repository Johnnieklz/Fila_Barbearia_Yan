-- ============================================================
-- FILA DE BARBEARIA — ROW LEVEL SECURITY
-- ============================================================
-- Regras (ver seção 10 do briefing):
--
-- Cliente (anônimo, sem login):
--   - PODE ler dados públicos da barbearia (nome, status da fila, etc.)
--   - PODE ler as entradas WAITING/CALLED/IN_SERVICE (para calcular a
--     própria posição e ver a fila em tempo real)
--   - PODE inserir sua própria entrada na fila (entrar na fila)
--   - NÃO PODE alterar status, remover, ou ver dados de outras barbearias
--     além do necessário para a fila pública
--
-- Barbeiro autenticado:
--   - PODE gerenciar (ler/editar/remover) apenas a(s) barbearia(s) que
--     ele é dono (owner_id = auth.uid())
--   - Ações sensíveis de fila (chamar próximo) passam pela função
--     SECURITY DEFINER call_next(), que já valida a posse
-- ============================================================

alter table public.profiles enable row level security;
alter table public.barbershops enable row level security;
alter table public.queue_entries enable row level security;

-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Inserção é feita pelo trigger handle_new_user (security definer),
-- então nenhuma policy de INSERT para usuários comuns é necessária.

-- ---------------------------------------------------------
-- BARBERSHOPS
-- ---------------------------------------------------------

-- Qualquer pessoa (inclusive anônima) pode ler os dados públicos
-- de uma barbearia — necessário para a página /fila/[slug].
drop policy if exists "barbershops_public_select" on public.barbershops;
create policy "barbershops_public_select"
  on public.barbershops for select
  using (true);

-- Apenas um usuário autenticado pode criar uma barbearia, e somente
-- para si mesmo como owner.
drop policy if exists "barbershops_insert_own" on public.barbershops;
create policy "barbershops_insert_own"
  on public.barbershops for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Apenas o dono pode atualizar (abrir/fechar fila, tempo médio, nome...)
drop policy if exists "barbershops_update_own" on public.barbershops;
create policy "barbershops_update_own"
  on public.barbershops for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Apenas o dono pode excluir a própria barbearia
drop policy if exists "barbershops_delete_own" on public.barbershops;
create policy "barbershops_delete_own"
  on public.barbershops for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------
-- QUEUE_ENTRIES
-- ---------------------------------------------------------

-- Leitura pública: qualquer pessoa pode ver as entradas da fila
-- (necessário para exibir quantidade de pessoas, posição, etc. na
-- página pública sem exigir login). Não expomos nenhum dado sensível
-- nessa tabela (apenas nome informado voluntariamente pelo cliente).
drop policy if exists "queue_entries_public_select" on public.queue_entries;
create policy "queue_entries_public_select"
  on public.queue_entries for select
  using (true);

-- Um cliente anônimo pode entrar na fila de uma barbearia com fila aberta.
drop policy if exists "queue_entries_public_insert" on public.queue_entries;
create policy "queue_entries_public_insert"
  on public.queue_entries for insert
  to anon, authenticated
  with check (
    status = 'WAITING'
    and exists (
      select 1 from public.barbershops b
      where b.id = barbershop_id
        and b.queue_open = true
    )
  );

-- Apenas o dono da barbearia pode alterar entradas (remover, marcar
-- concluído manualmente etc). Chamar o próximo é feito via função
-- call_next() (security definer), não diretamente por UPDATE do cliente.
drop policy if exists "queue_entries_update_owner" on public.queue_entries;
create policy "queue_entries_update_owner"
  on public.queue_entries for update
  to authenticated
  using (public.is_barbershop_owner(barbershop_id))
  with check (public.is_barbershop_owner(barbershop_id));

-- Apenas o dono pode remover entradas da fila.
drop policy if exists "queue_entries_delete_owner" on public.queue_entries;
create policy "queue_entries_delete_owner"
  on public.queue_entries for delete
  to authenticated
  using (public.is_barbershop_owner(barbershop_id));
