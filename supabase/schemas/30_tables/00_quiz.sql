create table public.quiz (
  id uuid primary key default gen_random_uuid(),
  type public.quiz_type not null,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quiz_created_at_idx on public.quiz (created_at desc);
