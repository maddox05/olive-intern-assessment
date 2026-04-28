-- Row-Level Security: closed-by-default on every public table.
--
-- Threat model. The Supabase publishable (anon) key is exposed to the
-- browser via NEXT_PUBLIC_SUPABASE_ANON_KEY. Without RLS, anyone with
-- that key could hit /rest/v1/quiz, /rest/v1/session, etc. and read or
-- mutate rows directly, bypassing every Server Action authorization
-- check we wrote.
--
-- Strategy.
--   1. Enable RLS on all 7 tables. With RLS enabled and zero policies,
--      anon access is fully denied (Postgres default-deny behavior).
--   2. Service-role connections (lib/supabase/server.ts — used by every
--      Server Action and route handler) bypass RLS automatically per
--      Postgres role behavior, so application code is unaffected.
--   3. Authenticated role would also be denied. We have no auth in the
--      MVP, so this is fine. When auth lands, add per-user policies
--      below using auth.uid().
--
-- Verification: GET /rest/v1/quiz with the anon key now returns []; with
-- the service-role key returns rows as before.
--
-- The FORCE keyword makes RLS apply even when the table OWNER queries —
-- a defense against accidental direct DB queries from misconfigured roles.
-- The supabase 'postgres' superuser still bypasses (Studio works fine).

alter table public.quiz                  enable row level security;
alter table public.question              enable row level security;
alter table public.option                enable row level security;
alter table public.result                enable row level security;
alter table public.session               enable row level security;
alter table public.questions_answered    enable row level security;
alter table public.result_screen_clicked enable row level security;
