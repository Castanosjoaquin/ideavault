-- =========================================================
-- IdeaVault — Initial schema
-- Tables: profiles, ideas, api_usage
-- All RLS policies in this migration (non-negotiable rule).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Utility: updated_at trigger function
-- ---------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- profiles
-- ---------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert via trigger (security definer). Delete via cascade from auth.users.

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- ideas
-- ---------------------------------------------------------
create table public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 5000),
  category    text not null default 'General',
  stage       text not null default 'seed' check (stage in ('seed','growing','ready')),
  development jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index ideas_user_id_created_at_idx
  on public.ideas (user_id, created_at desc)
  where deleted_at is null;

create index ideas_user_id_stage_idx
  on public.ideas (user_id, stage)
  where deleted_at is null;

create trigger ideas_updated_at
  before update on public.ideas
  for each row execute function public.handle_updated_at();

alter table public.ideas enable row level security;

create policy "ideas_select_own"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "ideas_insert_own"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "ideas_update_own"
  on public.ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ideas_delete_own"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- api_usage (Anthropic rate limiting)
-- ---------------------------------------------------------
create table public.api_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  model         text not null check (model in ('haiku','sonnet')),
  tokens_input  integer,
  tokens_output integer,
  created_at    timestamptz not null default now()
);

create index api_usage_user_id_created_at_idx
  on public.api_usage (user_id, created_at desc);

alter table public.api_usage enable row level security;

create policy "api_usage_select_own"
  on public.api_usage for select
  using (auth.uid() = user_id);

-- Insert/update/delete solo vía service role desde Edge Functions.
