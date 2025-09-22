-- Database schema for BetSpread
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  unit text default 'units',
  created_at timestamptz default now()
);

create table if not exists public.bets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  matchday date not null,
  match text not null,
  market text not null,
  odds numeric not null,
  stake numeric not null,
  book text,
  result text default 'Pending',
  note text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.bets enable row level security;

-- Users policies
create policy "Users can view own" on public.users for select using (auth.uid() = id);
create policy "Users can update own" on public.users for update using (auth.uid() = id);
create policy "Users can insert own" on public.users for insert with check (auth.uid() = id);

-- Projects policies
create policy "Projects view" on public.projects for select using (auth.uid() = user_id);
create policy "Projects insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "Projects update" on public.projects for update using (auth.uid() = user_id);
create policy "Projects delete" on public.projects for delete using (auth.uid() = user_id);

-- Bets policies
create policy "Bets view" on public.bets for select using (auth.uid() = user_id);
create policy "Bets insert" on public.bets for insert with check (auth.uid() = user_id);
create policy "Bets update" on public.bets for update using (auth.uid() = user_id);
create policy "Bets delete" on public.bets for delete using (auth.uid() = user_id);
