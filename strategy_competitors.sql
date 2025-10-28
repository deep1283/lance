-- Strategy Lab: Competitors cached insights
-- Run this in Supabase SQL editor

-- 1) Table
create table if not exists public.strategy_competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  start_date date not null,
  end_date date not null,
  top_hashtags jsonb not null default '[]'::jsonb,
  top_keywords jsonb not null default '[]'::jsonb,
  top_creatives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_competitors_user_fk foreign key (user_id)
    references public.users (id) on delete cascade
);

-- 2) Helpful indexes
create index if not exists idx_strategy_competitors_user_range
  on public.strategy_competitors (user_id, start_date desc);

-- 3) RLS
alter table public.strategy_competitors enable row level security;

-- Allow authenticated users to read only their own cached insights
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'strategy_competitors'
      and policyname = 'Read own strategy_competitors'
  ) then
    create policy "Read own strategy_competitors"
      on public.strategy_competitors for select
      using ( user_id = auth.uid() );
  end if;
end$$;

-- Writes are performed via service role (admin API). Optional: allow owner inserts/updates if needed.
-- If you want to restrict writes to service role only, do not create INSERT/UPDATE/DELETE policies.

-- 4) Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_strategy_competitors_updated_at on public.strategy_competitors;
create trigger trg_strategy_competitors_updated_at
before update on public.strategy_competitors
for each row execute function public.set_updated_at();


