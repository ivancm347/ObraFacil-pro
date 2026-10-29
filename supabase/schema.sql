-- Execute no SQL Editor do seu projeto Supabase antes de ativar pagamentos.
create extension if not exists pgcrypto;

create table if not exists public.pro_orders (
  id uuid primary key,
  email text not null,
  status text not null default 'pending' check (status in ('pending','approved','checkout_error')),
  amount numeric(10,2) not null check (amount = 14.99),
  product text not null,
  preference_id text,
  payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.pro_licenses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default false,
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Do not expose these tables to anonymous clients. Netlify Functions use the service-role key.
alter table public.pro_orders enable row level security;
alter table public.pro_licenses enable row level security;
revoke all on public.pro_orders from anon, authenticated;
revoke all on public.pro_licenses from anon, authenticated;
