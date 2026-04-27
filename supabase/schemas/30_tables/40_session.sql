create table public.session (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  -- captured client-side from navigator.userAgent + document.referrer at session start
  device text,
  browser text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_quiz_id_idx on public.session (quiz_id, start_time desc);
create index session_completion_idx on public.session (quiz_id, end_time);
