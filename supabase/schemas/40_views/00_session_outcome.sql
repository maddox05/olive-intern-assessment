-- Computed-on-read outcome per session: total score (sum of chosen-option scores)
-- and tag tally (jsonb of tag -> count). Used by analytics queries.
-- Card quizzes use the same path as score quizzes; tag quizzes ignore total_score.
create or replace view public.session_outcome as
with chosen_options as (
  -- single-choice answers contribute their option directly
  select qa.session_id, qa.question_id, o.score, o.tags
  from public.questions_answered qa
  join public.option o on o.id = qa.option_chosen_id
  where qa.option_chosen_id is not null
  union all
  -- select-multiple answers contribute every selected option
  select qa.session_id, qa.question_id, o.score, o.tags
  from public.questions_answered qa
  join public.option o on o.id = any(qa.selected_option_ids)
  where qa.selected_option_ids is not null
), slider_answers as (
  -- slider answers contribute the user's chosen numeric value as the score
  select qa.session_id, qa.numeric_answer as score, '{}'::text[] as tags
  from public.questions_answered qa
  where qa.numeric_answer is not null
), all_contributions as (
  select session_id, score, tags from chosen_options
  union all
  select session_id, score, tags from slider_answers
), per_session as (
  select
    session_id,
    coalesce(sum(score), 0)::int as total_score,
    array_agg(t) filter (where t is not null) as flat_tags
  from all_contributions, lateral unnest(coalesce(tags, '{}')) as t
  group by session_id
)
select
  s.id as session_id,
  s.quiz_id,
  s.start_time,
  s.end_time,
  coalesce(ps.total_score, 0)::int as total_score,
  coalesce(
    (select jsonb_object_agg(tag, cnt) from (
       select tag, count(*) as cnt
       from unnest(coalesce(ps.flat_tags, '{}')) as tag
       group by tag
     ) t),
    '{}'::jsonb
  ) as tag_counts
from public.session s
left join per_session ps on ps.session_id = s.id;
