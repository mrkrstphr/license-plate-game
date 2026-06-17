-- ============================================================================
-- Allow reading a profile's email when that user is the owner of, or has
-- contributed (found_by) to, a game the current viewer already has
-- legitimate access to (their own game, or a valid view/collaborate share).
-- Without this, the profiles(email) join used to attribute plate finds
-- silently returns null for every user except yourself, since the base
-- "Users can view their own profile" policy only allows auth.uid() = id.
-- ============================================================================

drop policy if exists "Profiles visible to people who can see their games" on profiles;
create policy "Profiles visible to people who can see their games"
  on profiles for select
  using (
    -- The viewer owns a game this profile owns or contributed to
    exists (
      select 1 from games
      where games.owner_id = profiles.id
      and games.owner_id = auth.uid()
    )
    or exists (
      select 1 from game_plates
      join games on games.id = game_plates.game_id
      where game_plates.found_by = profiles.id
      and games.owner_id = auth.uid()
    )
    -- Or the profile is reachable via a publicly shared game (view or
    -- collaborate) — covers signed-out view-link visitors and any
    -- signed-in collaborator looking at the same shared game.
    or exists (
      select 1 from game_plates
      join games on games.id = game_plates.game_id
      where game_plates.found_by = profiles.id
      and game_has_share(games.id, array['view', 'collaborate'])
    )
    or exists (
      select 1 from games
      where games.owner_id = profiles.id
      and game_has_share(games.id, array['view', 'collaborate'])
    )
    -- Or the viewer is looking at their own access logs for a share
    or exists (
      select 1 from share_access
      join game_shares on game_shares.id = share_access.share_id
      join games on games.id = game_shares.game_id
      where share_access.user_id = profiles.id
      and games.owner_id = auth.uid()
    )
  );
