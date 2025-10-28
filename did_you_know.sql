-- Did You Know section for main dashboard (per-user)
-- Run this in Supabase SQL editor

-- 1) Table
create table if not exists public.did_you_know (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  note text not null,
  date date not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint did_you_know_user_fk foreign key (user_id)
    references public.users (id) on delete cascade
);

-- 2) Helpful indexes
create index if not exists idx_did_you_know_user_date
  on public.did_you_know (user_id, date desc);

-- 3) RLS
alter table public.did_you_know enable row level security;

-- Allow authenticated users to read only their own entries
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'did_you_know'
      and policyname = 'Read own did_you_know'
  ) then
    create policy "Read own did_you_know"
      on public.did_you_know for select
      using ( user_id = auth.uid() );
  end if;
end$$;

-- Writes via service role (admin). Do not add insert/update/delete policies for regular users.

-- 4) Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_did_you_know_updated_at on public.did_you_know;
create trigger trg_did_you_know_updated_at
before update on public.did_you_know
for each row execute function public.set_updated_at();
