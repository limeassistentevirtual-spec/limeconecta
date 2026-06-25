-- LIMECONECTA - Políticas de administrador
-- Rode este script no Supabase > SQL Editor > New query > Run

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = user_id
      and papel = 'admin'
      and ativo = true
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- PERFIS: admin pode ver, criar e editar todos os perfis
create policy if not exists "admin pode ver perfis"
on public.perfis
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy if not exists "admin pode criar perfis"
on public.perfis
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy if not exists "admin pode atualizar perfis"
on public.perfis
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- CONFIGURAÇÕES
create policy if not exists "admin pode gerenciar configuracoes"
on public.configuracoes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- PACIENTES
create policy if not exists "admin pode gerenciar pacientes"
on public.pacientes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- CONSULTAS
create policy if not exists "admin pode gerenciar consultas"
on public.consultas
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- VALORES ESPECIAIS
create policy if not exists "admin pode gerenciar valores especiais"
on public.valores_especiais
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- HISTÓRICO
create policy if not exists "admin pode gerenciar historico"
on public.historico
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
