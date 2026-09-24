-- ════════════════════════════════════════════════════════
-- BrightWay Career — Supabase Schema
-- Run in Supabase SQL Editor (https://app.supabase.com)
-- ════════════════════════════════════════════════════════

-- ── 1. PROFILES (extends auth.users) ──────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  provider text default 'email',  -- 'google' | 'email' | 'phone'
  grade text,                     -- 'Lớp 10' | 'Lớp 11' | 'Lớp 12' | 'Sinh viên'
  region text,                    -- 'Miền Bắc' | 'Miền Trung' | 'Miền Nam'
  target_score numeric(4,2),      -- target GPA
  career_interest text[],         -- array of group strings
  holland_code text,              -- dominant 3-letter RIASEC code
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. FAVORITE JOBS ─────────────────────────────────
create table if not exists public.favorite_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_name text not null,
  job_data jsonb not null,        -- snapshot of job
  created_at timestamptz default now(),
  unique (user_id, job_name)
);
create index if not exists idx_fav_user on public.favorite_jobs(user_id);

-- ── 3. SEARCH HISTORY ────────────────────────────────
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  query text not null,
  filter_holland text,
  results_count int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_search_user on public.search_history(user_id, created_at desc);

-- ── 4. ESSAYS (luận cá nhân) ────────────────────────
create table if not exists public.essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  prompt text,
  feedback jsonb default '{}'::jsonb,
  word_count int default 0,
  is_draft boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_essay_user on public.essays(user_id, updated_at desc);

-- ── 5. ROW LEVEL SECURITY ────────────────────────────
alter table public.profiles enable row level security;
alter table public.favorite_jobs enable row level security;
alter table public.search_history enable row level security;
alter table public.essays enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Favorite jobs: own only
create policy "fav_select_own" on public.favorite_jobs
  for select using (auth.uid() = user_id);
create policy "fav_insert_own" on public.favorite_jobs
  for insert with check (auth.uid() = user_id);
create policy "fav_delete_own" on public.favorite_jobs
  for delete using (auth.uid() = user_id);

-- Search history: own only
create policy "search_select_own" on public.search_history
  for select using (auth.uid() = user_id);
create policy "search_insert_own" on public.search_history
  for insert with check (auth.uid() = user_id);
create policy "search_delete_own" on public.search_history
  for delete using (auth.uid() = user_id);

-- Essays: own only
create policy "essay_select_own" on public.essays
  for select using (auth.uid() = user_id);
create policy "essay_insert_own" on public.essays
  for insert with check (auth.uid() = user_id);
create policy "essay_update_own" on public.essays
  for update using (auth.uid() = user_id);
create policy "essay_delete_own" on public.essays
  for delete using (auth.uid() = user_id);

-- ── 6. UPDATED_AT TRIGGER ────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists essays_updated_at on public.essays;
create trigger essays_updated_at before update on public.essays
  for each row execute procedure public.set_updated_at();
