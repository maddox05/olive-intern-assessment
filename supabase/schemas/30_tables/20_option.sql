create table public.option (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question(id) on delete cascade,
  text text not null,
  -- nullable: tag-typed quizzes don't use score; score/card-typed quizzes don't use tags
  score integer,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index option_question_id_idx on public.option (question_id, position);
