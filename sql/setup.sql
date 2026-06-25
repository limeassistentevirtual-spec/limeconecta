-- LIMECONECTA Sprint 1 — Supabase setup
-- Rode este SQL no Supabase: SQL Editor > New query > Run

create extension if not exists "uuid-ossp";

create table if not exists public.usuarios (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique,
  nome text not null,
  email text unique not null,
  papel text not null default 'psicologa' check (papel in ('admin','psicologa')),
  plano text default 'Teste',
  ativo boolean default true,
  primeiro_acesso boolean default true,
  vencimento date,
  ultimo_acesso timestamptz,
  criado_em timestamptz default now()
);

create table if not exists public.pacientes (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  nome text not null,
  valor_padrao numeric(12,2) default 0,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.valores_especiais (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  paciente_id uuid references public.pacientes(id) on delete cascade,
  tipo text default 'Triagem',
  data date,
  valor numeric(12,2) default 0,
  criado_em timestamptz default now()
);

create table if not exists public.configuracoes (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  chave text not null,
  valor jsonb,
  atualizado_em timestamptz default now(),
  unique(usuario_id, chave)
);

alter table public.usuarios enable row level security;
alter table public.pacientes enable row level security;
alter table public.valores_especiais enable row level security;
alter table public.configuracoes enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from public.usuarios u where u.auth_user_id = auth.uid() and u.papel = 'admin' and u.ativo = true);
$$;

create policy "usuarios_select_self_or_admin" on public.usuarios for select using (auth_user_id = auth.uid() or public.is_admin());
create policy "usuarios_update_self_or_admin" on public.usuarios for update using (auth_user_id = auth.uid() or public.is_admin());
create policy "usuarios_admin_insert" on public.usuarios for insert with check (public.is_admin());

create policy "pacientes_owner_select" on public.pacientes for select using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "pacientes_owner_insert" on public.pacientes for insert with check (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "pacientes_owner_update" on public.pacientes for update using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "pacientes_owner_delete" on public.pacientes for delete using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());

create policy "valores_owner_all_select" on public.valores_especiais for select using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "valores_owner_all_insert" on public.valores_especiais for insert with check (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "valores_owner_all_update" on public.valores_especiais for update using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "valores_owner_all_delete" on public.valores_especiais for delete using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());

create policy "config_owner_select" on public.configuracoes for select using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "config_owner_insert" on public.configuracoes for insert with check (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "config_owner_update" on public.configuracoes for update using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
create policy "config_owner_delete" on public.configuracoes for delete using (usuario_id in (select id from public.usuarios where auth_user_id = auth.uid()) or public.is_admin());
