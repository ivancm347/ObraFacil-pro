-- =============================================
-- OBRAFACIL PRO - Schema Completo v2
-- Supabase / PostgreSQL
-- =============================================

-- Limpeza segura (ordem correta)
drop trigger if exists set_updated_at_ofertas on public.ofertas;
drop policy if exists "Leitura publica ofertas publicadas" on public.ofertas;
drop policy if exists "Escrita para autenticados" on public.ofertas;
drop table if exists public.ofertas cascade;
drop function if exists public.handle_updated_at();

-- Funcao updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tabela OFERTAS
create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(10,2),
  preco_antigo numeric(10,2),
  categoria text not null default 'Ferramentas',
  link_afiliado text not null,
  link_imagem text,
  descricao_curta text,
  descricao_longa text,
  publicada boolean not null default true,
  destaque boolean not null default false,
  visualizacoes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices
create index idx_ofertas_publicada on public.ofertas (publicada);
create index idx_ofertas_categoria on public.ofertas (categoria);
create index idx_ofertas_created_at on public.ofertas (created_at desc);
create index idx_ofertas_destaque on public.ofertas (destaque) where destaque = true;

-- Trigger updated_at
create trigger set_updated_at_ofertas
  before update on public.ofertas
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.ofertas enable row level security;

create policy "Leitura publica ofertas publicadas"
  on public.ofertas for select
  using (publicada = true);

create policy "Escrita para autenticados"
  on public.ofertas for all
  to authenticated
  using (true)
  with check (true);

-- Recarregar schema cache do PostgREST
notify pgrst, 'reload schema';
