-- ============================================================================
-- Collaborator tracking for shared games
-- ============================================================================

-- Track who last toggled each plate (owner or a collaborator via a share link)
alter table game_plates add column if not exists found_by uuid references profiles(id) on delete set null;

-- Log every distinct user who has opened a given share link, so the owner
-- can see who has access before revoking — independent of whether that
-- person has actually edited anything yet.
create table if not exists share_access (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references game_shares(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  first_accessed_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  unique (share_id, user_id)
);

alter table share_access enable row level security;

create index if not exists share_access_share_id_idx on share_access(share_id);
create index if not exists share_access_user_id_idx on share_access(user_id);

-- Owners can see who has accessed shares on their own games
drop policy if exists "Owners can view access logs for their own game shares" on share_access;
create policy "Owners can view access logs for their own game shares"
  on share_access for select
  using (
    exists (
      select 1 from game_shares
      join games on games.id = game_shares.game_id
      where game_shares.id = share_access.share_id
      and games.owner_id = auth.uid()
    )
  );

-- Any authenticated user can record their own access to a share they hold
-- a valid token for (the token itself was already validated client-side
-- via game_shares select, which is public; this just logs the visit).
drop policy if exists "Authenticated users can record their own share access" on share_access;
create policy "Authenticated users can record their own share access"
  on share_access for insert
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update their own share access" on share_access;
create policy "Authenticated users can update their own share access"
  on share_access for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Update the collaborate-edit policy so found_by is always set to the
-- editor's own id — prevents spoofing attribution to someone else.
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
    and (found_by is null or found_by = auth.uid())
  );

-- Owners editing their own games should also be able to set found_by
-- (to themselves) without restriction — already covered by the existing
-- "Owners can do everything" policy on game_plates, which has no found_by
-- constraint, so no change needed there.
