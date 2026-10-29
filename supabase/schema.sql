-- OBRAFACIL PRO - Supabase schema seguro e compatível
-- Este script NÃO apaga tabelas nem ofertas existentes.
create extension if not exists pgcrypto;

create table if not exists public.ofertas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(10,2),
  preco_antigo numeric(10,2),
  categoria text not null default 'Ferramentas',
  link_afiliado text,
  link_imagem text,
  descricao_curta text,
  descricao_longa text,
  publicada boolean not null default true,
  destaque boolean not null default false,
  visualizacoes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Completa colunas ausentes sem remover dados.
alter table public.ofertas add column if not exists nome text;
alter table public.ofertas add column if not exists preco numeric(10,2);
alter table public.ofertas add column if not exists preco_antigo numeric(10,2);
alter table public.ofertas add column if not exists categoria text default 'Ferramentas';
alter table public.ofertas add column if not exists link_afiliado text;
alter table public.ofertas add column if not exists link_imagem text;
alter table public.ofertas add column if not exists descricao_curta text;
alter table public.ofertas add column if not exists descricao_longa text;
alter table public.ofertas add column if not exists publicada boolean not null default true;
alter table public.ofertas add column if not exists destaque boolean not null default false;
alter table public.ofertas add column if not exists visualizacoes integer not null default 0;
alter table public.ofertas add column if not exists created_at timestamptz not null default now();
alter table public.ofertas add column if not exists updated_at timestamptz not null default now();

-- Migra dados de nomes usados por uma versão anterior, se essas colunas existirem.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ofertas' and column_name='link') then
    execute 'update public.ofertas set link_afiliado = coalesce(link_afiliado, link)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ofertas' and column_name='imagem') then
    execute 'update public.ofertas set link_imagem = coalesce(link_imagem, imagem)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ofertas' and column_name='descricao') then
    execute 'update public.ofertas set descricao_curta = coalesce(descricao_curta, descricao)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ofertas' and column_name='criada_em') then
    execute 'update public.ofertas set created_at = coalesce(created_at, criada_em)';
  end if;
end $$;

create index if not exists idx_ofertas_publicada on public.ofertas (publicada);
create index if not exists idx_ofertas_categoria on public.ofertas (categoria);
create index if not exists idx_ofertas_created_at on public.ofertas (created_at desc);
create index if not exists idx_ofertas_destaque on public.ofertas (destaque) where destaque = true;

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_ofertas on public.ofertas;
create trigger set_updated_at_ofertas before update on public.ofertas
for each row execute function public.handle_updated_at();

-- Lista de usuários explicitamente autorizados como administradores.
create table if not exists public.obrafacil_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.obrafacil_admins enable row level security;

create or replace function public.obrafacil_e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.obrafacil_admins a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.obrafacil_e_admin() from public;
grant execute on function public.obrafacil_e_admin() to authenticated;

alter table public.ofertas enable row level security;
drop policy if exists "Leitura publica ofertas publicadas" on public.ofertas;
drop policy if exists "Escrita para autenticados" on public.ofertas;
drop policy if exists "Public can read published offers" on public.ofertas;
drop policy if exists "Admins manage offers" on public.ofertas;

create policy "Public can read published offers"
on public.ofertas for select to anon, authenticated
using (publicada = true or public.obrafacil_e_admin());

create policy "Admins manage offers"
on public.ofertas for all to authenticated
using (public.obrafacil_e_admin())
with check (public.obrafacil_e_admin());

grant select on public.ofertas to anon, authenticated;
grant insert, update, delete on public.ofertas to authenticated;
notify pgrst, 'reload schema';
