-- ============================================================================
-- SECURITY FIX: share tokens were not actually enforced by RLS
--
-- Root cause: "Anyone can read a share by token" was `using (true)` with no
-- actual token comparison -- it made every row in game_shares readable to
-- anyone, not just the row matching a given token. Combined with
-- game_has_share(game_id, modes) checking only game_id + mode (never the
-- token), anyone holding the anon key could:
--   1. select * from game_shares to enumerate every token, game_id, and
--      mode ever created across all users
--   2. read any shared game's data, or edit any collaborate-shared game,
--      by game_id alone -- no token needed at all
--   3. read any contributor's email via the profiles policy added in
--      20260618000000, which also gated on game_has_share() with no token
--
-- Fix: lock game_shares down to owner-only direct table access. All public
-- (token-based) access now goes through security-definer RPC functions that
-- take the token as a parameter and do `where token = p_token` *inside* the
-- function -- the only place a token check can actually happen, since RLS
-- policies have no way to see a client's query parameters, only row data
-- and auth.uid(). This mirrors the pattern already used correctly for
-- increment_share_view_count.
-- ============================================================================

-- ── Lock down game_shares: remove the public blanket-read policy ──────────

drop policy if exists "Anyone can read a share by token" on game_shares;

-- Only the existing "Owners can manage shares for their own games" policy
-- remains, so direct table reads/writes on game_shares now require owning
-- the underlying game. (No change needed to that policy -- it was already
-- correctly scoped.)

-- ── Remove the unsafe helper and its dependent public policies ────────────

drop policy if exists "Public can view shared games" on games;
drop policy if exists "Public can view plates of shared games" on game_plates;
drop policy if exists "Authenticated users can edit plates on collaborate-shared games" on game_plates;
drop policy if exists "Profiles visible to people who can see their games" on profiles;

drop function if exists game_has_share(uuid, text[]);

-- Re-add profile visibility for the *owner-only* case: an owner viewing
-- their own game (normal RLS via owner_id = auth.uid(), no token involved
-- at all) needs to see contributors' emails for the found_by attribution
-- badges. This does not need a token check since it's gated entirely on
-- already owning the game -- there's no way to reach another owner's
-- contributors through this policy.
create policy "Owners can view profiles of contributors to their games"
  on profiles for select
  using (
    exists (
      select 1 from game_plates
      join games on games.id = game_plates.game_id
      where game_plates.found_by = profiles.id
      and games.owner_id = auth.uid()
    )
    or exists (
      select 1 from share_access
      join game_shares on game_shares.id = share_access.share_id
      join games on games.id = game_shares.game_id
      where share_access.user_id = profiles.id
      and games.owner_id = auth.uid()
    )
  );

-- Shared-game visitors (via a valid token) get contributor emails through
-- get_shared_game()'s own join below, which runs as security definer and
-- so doesn't need a profiles RLS policy at all -- it bypasses RLS by
-- design, scoped entirely by the token check inside the function.

-- ── Token-gated RPCs: the only legitimate way to access shared data ───────

-- Resolves a token to its share row. Returns nothing if the token doesn't
-- exist -- callers must treat an empty result as "link not found", same
-- as before this fix.
create or replace function resolve_share(p_token text)
returns table (share_id uuid, game_id uuid, mode text)
language sql
security definer
set search_path = public
stable
as $$
  select id, game_shares.game_id, game_shares.mode
  from game_shares
  where token = p_token;
$$;

grant execute on function resolve_share(text) to anon, authenticated;

-- Returns the full game + plate data for a valid token, in one call.
-- This is what shared.$token.tsx should call going forward instead of
-- doing separate .from("games")/.from("game_plates") queries that relied
-- on the now-removed public RLS policies.
create or replace function get_shared_game(p_token text)
returns table (
  game_id uuid,
  name text,
  date date,
  created_at timestamptz,
  mode text,
  plate_code text,
  found boolean,
  found_by_email text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    g.id, g.name, g.date, g.created_at,
    gs.mode,
    gp.code, gp.found,
    p.email
  from game_shares gs
  join games g on g.id = gs.game_id
  left join game_plates gp on gp.game_id = g.id
  left join profiles p on p.id = gp.found_by
  where gs.token = p_token;
$$;

grant execute on function get_shared_game(text) to anon, authenticated;

-- Toggles a plate on a collaborate-shared game, verifying the token,
-- the share's mode, and that the caller is authenticated, all inside the
-- function (so none of this depends on any standalone RLS policy that a
-- client could route around).
create or replace function set_shared_plate_found(p_token text, p_code text, p_found boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_mode text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select gs.game_id, gs.mode into v_game_id, v_mode
  from game_shares gs
  where gs.token = p_token;

  if v_game_id is null then
    raise exception 'Invalid share link';
  end if;

  if v_mode != 'collaborate' then
    raise exception 'This link is view-only';
  end if;

  update game_plates
  set found = p_found,
      found_at = case when p_found then now() else null end,
      found_by = case when p_found then auth.uid() else null end
  where game_id = v_game_id and code = p_code;

  return true;
end;
$$;

grant execute on function set_shared_plate_found(text, text, boolean) to anon, authenticated;

-- Logs that the current authenticated user opened a collaborate share link.
-- Verifies the token resolves to a real collaborate share before logging,
-- rather than trusting a client-supplied share_id directly (the previous
-- recordShareAccess() took a share_id with no proof the caller ever held
-- the corresponding token).
create or replace function record_share_access(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share_id uuid;
begin
  if auth.uid() is null then
    return;
  end if;

  select id into v_share_id
  from game_shares
  where token = p_token and mode = 'collaborate';

  if v_share_id is null then
    return;
  end if;

  insert into share_access (share_id, user_id, last_accessed_at)
  values (v_share_id, auth.uid(), now())
  on conflict (share_id, user_id)
  do update set last_accessed_at = excluded.last_accessed_at;
end;
$$;

grant execute on function record_share_access(text) to anon, authenticated;

-- Remove the direct insert/update policies on share_access now that
-- record_share_access() is the only legitimate way to write to this table.
-- The old policies allowed any authenticated user to insert a row for any
-- share_id they could guess (as long as user_id = themselves), which let
-- someone false-flag themselves as a collaborator on a share they were
-- never actually given the token for. share_access is a security-definer
-- function table now -- writes happen as the function owner, which
-- bypasses RLS by design, so no insert/update policy is needed at all.
drop policy if exists "Authenticated users can record their own share access" on share_access;
drop policy if exists "Authenticated users can update their own share access" on share_access;

-- increment_share_view_count already correctly required the token (see
-- 20260619000000) and is unaffected by this fix.
