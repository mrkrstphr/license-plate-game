-- ============================================================================
-- License Plate Game — initial schema
-- ============================================================================

create extension if not exists pgcrypto;

-- Profiles: one row per authenticated user (email or anonymous)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================================
-- Games
-- ============================================================================

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table games enable row level security;

create index if not exists games_owner_id_idx on games(owner_id);

drop policy if exists "Owners can do everything with their own games" on games;
create policy "Owners can do everything with their own games"
  on games for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ============================================================================
-- Game plates: one row per state/province per game
-- ============================================================================

create table if not exists game_plates (
  game_id uuid not null references games(id) on delete cascade,
  code text not null,
  found boolean not null default false,
  found_at timestamptz,
  primary key (game_id, code)
);

alter table game_plates enable row level security;

create index if not exists game_plates_game_id_idx on game_plates(game_id);

drop policy if exists "Owners can do everything with their own game plates" on game_plates;
create policy "Owners can do everything with their own game plates"
  on game_plates for all
  using (
    exists (
      select 1 from games
      where games.id = game_plates.game_id
      and games.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from games
      where games.id = game_plates.game_id
      and games.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Game shares: view or collaborate links
-- ============================================================================

create table if not exists game_shares (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  mode text not null check (mode in ('view', 'collaborate')),
  created_at timestamptz not null default now()
);

alter table game_shares enable row level security;

create index if not exists game_shares_game_id_idx on game_shares(game_id);
create index if not exists game_shares_token_idx on game_shares(token);

drop policy if exists "Owners can manage shares for their own games" on game_shares;
create policy "Owners can manage shares for their own games"
  on game_shares for all
  using (
    exists (
      select 1 from games
      where games.id = game_shares.game_id
      and games.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from games
      where games.id = game_shares.game_id
      and games.owner_id = auth.uid()
    )
  );

-- Anyone (including anon) can look up a share by token — needed to resolve
-- a share link before they're necessarily authenticated.
drop policy if exists "Anyone can read a share by token" on game_shares;
create policy "Anyone can read a share by token"
  on game_shares for select
  using (true);

-- ============================================================================
-- Public access via share tokens
-- ============================================================================

-- Helper: does a valid share of the given mode(s) exist for this game?
create or replace function game_has_share(p_game_id uuid, p_modes text[])
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from game_shares
    where game_shares.game_id = p_game_id
    and game_shares.mode = any(p_modes)
  );
$$;

-- Public read access to games that have any share (view or collaborate)
drop policy if exists "Public can view shared games" on games;
create policy "Public can view shared games"
  on games for select
  using (game_has_share(id, array['view', 'collaborate']));

-- Public read access to plates of shared games
drop policy if exists "Public can view plates of shared games" on game_plates;
create policy "Public can view plates of shared games"
  on game_plates for select
  using (game_has_share(game_id, array['view', 'collaborate']));

-- Authenticated (incl. anonymous) users can update plates on collaborate-shared games
drop policy if exists "Authenticated users can edit plates on collaborate-shared games" on game_plates;
create policy "Authenticated users can edit plates on collaborate-shared games"
  on game_plates for update
  using (
    auth.uid() is not null
    and game_has_share(game_id, array['collaborate'])
  )
  with check (
    auth.uid() is not null
    and game_has_share(game_id, array['collaborate'])
  );

-- ============================================================================
-- updated_at trigger for games
-- ============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_set_updated_at on games;
create trigger games_set_updated_at
  before update on games
  for each row execute procedure set_updated_at();
