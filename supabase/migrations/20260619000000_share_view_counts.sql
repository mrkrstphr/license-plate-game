-- ============================================================================
-- View counts for share links
-- ============================================================================

alter table game_shares add column if not exists view_count integer not null default 0;

-- security definer RPC so anonymous (signed-out) visitors to a view-mode
-- share link can increment the counter without needing any direct UPDATE
-- grant on game_shares — they only ever call this function with a token
-- they already hold, never touch the table directly.
create or replace function increment_share_view_count(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update game_shares
  set view_count = view_count + 1
  where token = p_token;
end;
$$;

-- Anyone can call the function (it's the function's own security definer
-- privileges, not the caller's, that perform the update) — but it can only
-- ever target the single row matching the token passed in, nothing else.
grant execute on function increment_share_view_count(text) to anon, authenticated;
