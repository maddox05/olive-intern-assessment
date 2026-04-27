-- Computed-on-read outcome per session: total score (sum of chosen-option
-- scores plus slider numeric values) and tag tally (jsonb of tag -> count).
-- Used by analytics queries.
-- Card quizzes use the same path as score quizzes; tag quizzes ignore
-- total_score and just consume tag_counts.
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
), per_session_score as (
  select session_id, coalesce(sum(score), 0)::int as total_score
  from all_contributions
  group by session_id
), per_session_tags as (
  -- Separate aggregation so empty-tag answers don't drop their score
  -- contribution (the previous version cross-joined unnest(tags) which
  -- annihilated rows when every tag array was empty).
  select ac.session_id, jsonb_object_agg(t.tag, t.cnt) as tag_counts
  from (
    select session_id, tag, count(*) as cnt
    from all_contributions, lateral unnest(tags) as tag
    group by session_id, tag
  ) t
  join all_contributions ac on ac.session_id = t.session_id
  group by ac.session_id
)
select
  s.id as session_id,
  s.quiz_id,
  s.start_time,
  s.end_time,
  coalesce(pss.total_score, 0)::int as total_score,
  coalesce(pst.tag_counts, '{}'::jsonb) as tag_counts
from public.session s
left join per_session_score pss on pss.session_id = s.id
left join per_session_tags pst on pst.session_id = s.id;
