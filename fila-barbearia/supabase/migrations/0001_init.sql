-- ============================================================
-- FILA DE BARBEARIA — SCHEMA INICIAL
-- ============================================================
-- Este arquivo cria toda a estrutura de banco necessária para o MVP:
-- tabelas, enums, índices, funções auxiliares e triggers.
-- As políticas de Row Level Security estão em 0002_rls.sql.
--
-- Como aplicar:
--   supabase db push
-- ou cole o conteúdo no SQL Editor do painel do Supabase.
-- ============================================================

-- ---------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'queue_entry_status') then
    create type public.queue_entry_status as enum (
      'WAITING',
      'CALLED',
      'IN_SERVICE',
      'COMPLETED',
      'REMOVED'
    );
  end if;
end$$;

-- ---------------------------------------------------------
-- TABELA: profiles
-- ---------------------------------------------------------
-- Um perfil por usuário autenticado (barbeiro/dono).
-- Preenchida automaticamente via trigger em auth.users (ver 0003).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário autenticado (barbeiro). Espelha auth.users.';

-- ---------------------------------------------------------
-- TABELA: barbershops
-- ---------------------------------------------------------
create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  queue_open boolean not null default false,
  average_service_minutes integer not null default 30 check (average_service_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.barbershops is 'Cada barbearia cadastrada. slug é usado na URL pública /fila/[slug].';

create index if not exists barbershops_owner_id_idx on public.barbershops (owner_id);

-- ---------------------------------------------------------
-- TABELA: queue_entries
-- ---------------------------------------------------------
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops (id) on delete cascade,
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  status public.queue_entry_status not null default 'WAITING',
  position integer not null default 0,
  client_token uuid not null default gen_random_uuid(),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.queue_entries is 'Entradas da fila de uma barbearia. client_token identifica anonimamente o dispositivo do cliente.';
comment on column public.queue_entries.client_token is 'UUID gerado no navegador do cliente (localStorage) para ele acompanhar sua própria posição sem login.';

create index if not exists queue_entries_barbershop_id_idx on public.queue_entries (barbershop_id);
create index if not exists queue_entries_status_idx on public.queue_entries (barbershop_id, status);
create index if not exists queue_entries_token_idx on public.queue_entries (client_token);

-- Evita duas pessoas "CALLED"/"IN_SERVICE" ao mesmo tempo na mesma barbearia
-- (uma única cadeira sendo usada por vez no MVP).
create unique index if not exists queue_entries_single_active_idx
  on public.queue_entries (barbershop_id)
  where status in ('CALLED', 'IN_SERVICE');

-- ---------------------------------------------------------
-- FUNÇÃO: is_admin()
-- ---------------------------------------------------------
-- Helper usado pelas políticas RLS para checar se o usuário autenticado
-- é um barbeiro/administrador (não distingue por barbearia; a posse da
-- barbearia é checada separadamente via owner_id).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin() is 'Retorna true se o usuário autenticado atual é um barbeiro/admin.';

-- ---------------------------------------------------------
-- FUNÇÃO: is_owner(barbershop_id)
-- ---------------------------------------------------------
create or replace function public.is_barbershop_owner(target_barbershop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbershops
    where id = target_barbershop_id
      and owner_id = auth.uid()
  );
$$;

comment on function public.is_barbershop_owner(uuid) is 'Retorna true se o usuário autenticado é dono da barbearia informada.';

-- ---------------------------------------------------------
-- FUNÇÃO: recalcula posições da fila
-- ---------------------------------------------------------
-- Reordena as posições de todos os clientes WAITING de uma barbearia,
-- respeitando a ordem de chegada (joined_at). Chamada sempre que a fila
-- muda (chamar próximo, remover, adicionar).
create or replace function public.recalculate_queue_positions(target_barbershop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ordered as (
    select id, row_number() over (order by joined_at asc) as new_position
    from public.queue_entries
    where barbershop_id = target_barbershop_id
      and status = 'WAITING'
  )
  update public.queue_entries qe
  set position = ordered.new_position
  from ordered
  where qe.id = ordered.id;
end;
$$;

comment on function public.recalculate_queue_positions(uuid) is 'Reatribui a coluna position de todos os clientes WAITING em ordem de chegada.';

-- Mantém as posições sempre corretas automaticamente
create or replace function public.trg_recalculate_positions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_queue_positions(coalesce(new.barbershop_id, old.barbershop_id));
  return null;
end;
$$;

drop trigger if exists queue_entries_after_change on public.queue_entries;
create trigger queue_entries_after_change
after insert or update of status or delete on public.queue_entries
for each row execute function public.trg_recalculate_positions();

-- ---------------------------------------------------------
-- FUNÇÃO: call_next(barbershop_id)
-- ---------------------------------------------------------
-- Chama o próximo cliente da fila de forma atômica, evitando condição de
-- corrida (dois barbeiros clicando "chamar próximo" ao mesmo tempo).
create or replace function public.call_next(target_barbershop_id uuid)
returns public.queue_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  next_entry public.queue_entries;
begin
  if not public.is_barbershop_owner(target_barbershop_id) then
    raise exception 'Não autorizado a gerenciar esta fila.';
  end if;

  -- Bloqueia a linha para evitar chamadas duplicadas concorrentes
  select * into next_entry
  from public.queue_entries
  where barbershop_id = target_barbershop_id
    and status = 'WAITING'
  order by joined_at asc
  limit 1
  for update skip locked;

  if next_entry.id is null then
    return null;
  end if;

  update public.queue_entries
  set status = 'CALLED', called_at = now()
  where id = next_entry.id
  returning * into next_entry;

  return next_entry;
end;
$$;

comment on function public.call_next(uuid) is 'Chama atomicamente o próximo cliente WAITING da fila. Só o dono da barbearia pode executar.';

-- ---------------------------------------------------------
-- updated_at automático em barbershops
-- ---------------------------------------------------------
create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists barbershops_set_updated_at on public.barbershops;
create trigger barbershops_set_updated_at
before update on public.barbershops
for each row execute function public.trg_set_updated_at();
