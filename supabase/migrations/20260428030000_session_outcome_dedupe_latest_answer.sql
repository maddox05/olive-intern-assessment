-- session_outcome view: when a user uses the back button and re-answers
-- the same question, we want only the LATEST answer per (session, question).
-- Earlier rows stay in the DB for the per-session deep-dive trace, but
-- they no longer double-count toward score, tags, or any aggregate.
create or replace view public.session_outcome
with (security_invoker = true)
as
with latest_answers as (
  select distinct on (qa.session_id, qa.question_id)
    qa.session_id, qa.question_id,
    qa.option_chosen_id, qa.selected_option_ids, qa.numeric_answer
  from public.questions_answered qa
  order by qa.session_id, qa.question_id, qa.answered_at desc
), chosen_options as (
  select qa.session_id, qa.question_id, o.score, o.tags
  from latest_answers qa
  join public.option o on o.id = qa.option_chosen_id
  where qa.option_chosen_id is not null
  union all
  select qa.session_id, qa.question_id, o.score, o.tags
  from latest_answers qa
  join public.option o on o.id = any(qa.selected_option_ids)
  where qa.selected_option_ids is not null
), slider_answers as (
  select qa.session_id, qa.numeric_answer as score, '{}'::text[] as tags
  from latest_answers qa
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
