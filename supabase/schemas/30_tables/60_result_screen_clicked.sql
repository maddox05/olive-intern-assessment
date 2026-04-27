create table public.result_screen_clicked (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.session(id) on delete cascade,
  result_id uuid not null references public.result(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- A session can only count once per result (prevents inflating CTA click
  -- rate above 100% on a re-click). The Server Action upserts; the unique
  -- constraint is the safety net.
  unique (session_id, result_id)
);

create index result_screen_clicked_session_idx on public.result_screen_clicked (session_id);
create index result_screen_clicked_result_idx on public.result_screen_clicked (result_id);
