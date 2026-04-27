create table public.questions_answered (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.session(id) on delete cascade,
  question_id uuid not null references public.question(id) on delete cascade,
  -- exactly one of these three is non-null per row, enforced by CHECK
  option_chosen_id uuid references public.option(id) on delete cascade,
  numeric_answer integer,
  selected_option_ids uuid[],
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exactly_one_answer check (
    (case when option_chosen_id is not null then 1 else 0 end) +
    (case when numeric_answer is not null then 1 else 0 end) +
    (case when selected_option_ids is not null then 1 else 0 end) = 1
  )
);

create index questions_answered_session_idx on public.questions_answered (session_id, answered_at);
create index questions_answered_question_idx on public.questions_answered (question_id);
