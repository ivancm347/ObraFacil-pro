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


-- OBRAFACIL PRO - dados comerciais por usuário, protegidos por RLS
-- Os dados comerciais ficam isolados por usuário autenticado.
-- Esta tabela nova não altera nem apaga as tabelas existentes.
create table if not exists public.obrafacil_dados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.obrafacil_dados enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'obrafacil_dados'
      and policyname = 'Usuário acessa apenas seus dados comerciais'
  ) then
    create policy "Usuário acessa apenas seus dados comerciais"
      on public.obrafacil_dados
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

grant select, insert, update, delete on public.obrafacil_dados to authenticated;
notify pgrst, 'reload schema';


-- Armazenamento de imagens das ofertas. Leitura pública, envio apenas por administradores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ofertas-imagens', 'ofertas-imagens', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Imagens de ofertas visíveis publicamente" on storage.objects;
create policy "Imagens de ofertas visíveis publicamente" on storage.objects for select to anon, authenticated using (bucket_id = 'ofertas-imagens');
drop policy if exists "Administradores enviam imagens de ofertas" on storage.objects;
create policy "Administradores enviam imagens de ofertas" on storage.objects for insert to authenticated with check (bucket_id = 'ofertas-imagens' and public.obrafacil_e_admin());
drop policy if exists "Administradores atualizam imagens de ofertas" on storage.objects;
create policy "Administradores atualizam imagens de ofertas" on storage.objects for update to authenticated using (bucket_id = 'ofertas-imagens' and public.obrafacil_e_admin()) with check (bucket_id = 'ofertas-imagens' and public.obrafacil_e_admin());
drop policy if exists "Administradores removem imagens de ofertas" on storage.objects;
create policy "Administradores removem imagens de ofertas" on storage.objects for delete to authenticated using (bucket_id = 'ofertas-imagens' and public.obrafacil_e_admin());

-- Licença PRO validada no servidor e vinculada à conta Supabase autenticada.
-- A ativação é manual após confirmação do pagamento via WhatsApp.
create table if not exists public.obrafacil_licencas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','ativo','cancelado')),
  expira_em timestamptz,
  atualizado_em timestamptz not null default now()
);
alter table public.obrafacil_licencas enable row level security;
drop policy if exists "Usuário consulta a própria licença" on public.obrafacil_licencas;
create policy "Usuário consulta a própria licença" on public.obrafacil_licencas for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Administradores gerenciam licenças" on public.obrafacil_licencas;
create policy "Administradores gerenciam licenças" on public.obrafacil_licencas for all to authenticated using (public.obrafacil_e_admin()) with check (public.obrafacil_e_admin());
grant select on public.obrafacil_licencas to authenticated;
grant insert, update, delete on public.obrafacil_licencas to authenticated;

create or replace function public.obrafacil_tem_licenca()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.obrafacil_licencas l where l.user_id = (select auth.uid()) and l.status = 'ativo' and (l.expira_em is null or l.expira_em > now()));
$$;
revoke all on function public.obrafacil_tem_licenca() from public;
grant execute on function public.obrafacil_tem_licenca() to authenticated;
notify pgrst, 'reload schema';

 
-- OBRAFACIL PRO: painel administrativo de clientes e licenças.
-- Execute este bloco depois que a conta administradora já existir no Auth.
insert into public.obrafacil_admins (user_id)
select id from auth.users where lower(email) = 'ivancm347@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.obrafacil_listar_clientes()
returns table (
  user_id uuid,
  email text,
  criado_em timestamptz,
  status text,
  expira_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.obrafacil_e_admin() then
    raise exception 'Acesso restrito ao administrador.';
  end if;

  return query
  select u.id, u.email::text, u.created_at,
         coalesce(l.status, 'gratuito')::text, l.expira_em
  from auth.users u
  left join public.obrafacil_licencas l on l.user_id = u.id
  order by u.created_at desc;
end;
$$;
revoke all on function public.obrafacil_listar_clientes() from public;
grant execute on function public.obrafacil_listar_clientes() to authenticated;

create or replace function public.obrafacil_definir_licenca(p_user_id uuid, p_ativo boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.obrafacil_e_admin() then
    raise exception 'Acesso restrito ao administrador.';
  end if;
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Cliente não encontrado.';
  end if;

  insert into public.obrafacil_licencas (user_id, status, expira_em, atualizado_em)
  values (p_user_id, case when p_ativo then 'ativo' else 'cancelado' end, null, now())
  on conflict (user_id) do update
    set status = excluded.status, expira_em = null, atualizado_em = now();
end;
$$;
revoke all on function public.obrafacil_definir_licenca(uuid, boolean) from public;
grant execute on function public.obrafacil_definir_licenca(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
