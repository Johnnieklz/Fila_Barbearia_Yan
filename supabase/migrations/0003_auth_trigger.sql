-- ============================================================
-- FILA DE BARBEARIA — TRIGGER DE CRIAÇÃO DE PERFIL
-- ============================================================
-- Sempre que um novo usuário é criado em auth.users (ex: barbeiro se
-- cadastra), criamos automaticamente a linha correspondente em
-- public.profiles. Isso evita ter que fazer essa inserção manualmente
-- no frontend (que exigiria bypassar RLS).
--
-- is_admin começa como true aqui porque, no MVP, todo usuário que se
-- cadastra é um barbeiro/dono de barbearia (não há hierarquia de
-- funcionários ainda). Ajuste essa regra quando adicionar múltiplos
-- funcionários por barbearia.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Cria automaticamente um perfil em public.profiles para cada novo usuário do Supabase Auth.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
