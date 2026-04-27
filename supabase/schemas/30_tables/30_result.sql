create table public.result (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  title_text text not null,
  description text not null default '',
  cta_text text not null default '',
  cta_url text not null default '',
  -- score range that this result matches; tag-typed quizzes have zero result rows
  range_lo integer not null,
  range_hi integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint result_range_valid check (range_lo <= range_hi)
);

create index result_quiz_id_idx on public.result (quiz_id, range_lo);
