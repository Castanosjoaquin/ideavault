alter table public.profiles
  add column tier text not null default 'free_trial'
  check (tier in ('free_trial','byok','paid'));

create index profiles_tier_idx on public.profiles (tier);
