-- Atomically upsert a full quiz from a JSON payload.
-- Inserts new rows, updates existing rows by id, and hard-deletes (cascade)
-- any child rows that the payload omits.
--
-- Payload shape (mirrors AIQuizJson in lib/types.ts):
-- {
--   id, type, title, description,
--   questions: [{ id, text, type, position,
--     options: [{ id, text, position, score?, tags? }] }],
--   results:   [{ id, title_text, description, cta_text, cta_url, range: [lo, hi] }]
-- }
--
-- Returns the quiz id.
create or replace function public.apply_quiz_diff(p_quiz jsonb)
returns uuid
language plpgsql
as $$
declare
  v_quiz_id uuid := (p_quiz ->> 'id')::uuid;
  v_q jsonb;
  v_o jsonb;
  v_r jsonb;
  v_question_ids uuid[] := '{}';
  v_option_ids uuid[];
  v_result_ids uuid[] := '{}';
begin
  -- Upsert quiz
  insert into public.quiz (id, type, title, description)
  values (
    v_quiz_id,
    (p_quiz ->> 'type')::public.quiz_type,
    p_quiz ->> 'title',
    coalesce(p_quiz ->> 'description', '')
  )
  on conflict (id) do update set
    type = excluded.type,
    title = excluded.title,
    description = excluded.description;

  -- Upsert questions and their options
  for v_q in select * from jsonb_array_elements(coalesce(p_quiz -> 'questions', '[]'::jsonb))
  loop
    insert into public.question (id, quiz_id, text, type, position)
    values (
      (v_q ->> 'id')::uuid,
      v_quiz_id,
      v_q ->> 'text',
      (v_q ->> 'type')::public.question_type,
      coalesce((v_q ->> 'position')::int, 0)
    )
    on conflict (id) do update set
      text = excluded.text,
      type = excluded.type,
      position = excluded.position;

    v_question_ids := v_question_ids || ((v_q ->> 'id')::uuid);

    v_option_ids := '{}';
    for v_o in select * from jsonb_array_elements(coalesce(v_q -> 'options', '[]'::jsonb))
    loop
      insert into public.option (id, question_id, text, score, tags, position)
      values (
        (v_o ->> 'id')::uuid,
        (v_q ->> 'id')::uuid,
        v_o ->> 'text',
        case when v_o ? 'score' and v_o ->> 'score' is not null
             then (v_o ->> 'score')::int
             else null end,
        case when v_o ? 'tags'
             then array(select jsonb_array_elements_text(v_o -> 'tags'))
             else '{}'::text[] end,
        coalesce((v_o ->> 'position')::int, 0)
      )
      on conflict (id) do update set
        text = excluded.text,
        score = excluded.score,
        tags = excluded.tags,
        position = excluded.position;

      v_option_ids := v_option_ids || ((v_o ->> 'id')::uuid);
    end loop;

    -- Delete options removed from this question
    delete from public.option
    where question_id = (v_q ->> 'id')::uuid
      and id <> all(v_option_ids);
  end loop;

  -- Delete questions removed from the quiz (cascades to options + answers)
  delete from public.question
  where quiz_id = v_quiz_id
    and id <> all(v_question_ids);

  -- Upsert results
  for v_r in select * from jsonb_array_elements(coalesce(p_quiz -> 'results', '[]'::jsonb))
  loop
    insert into public.result (id, quiz_id, title_text, description, cta_text, cta_url, range_lo, range_hi)
    values (
      (v_r ->> 'id')::uuid,
      v_quiz_id,
      v_r ->> 'title_text',
      coalesce(v_r ->> 'description', ''),
      coalesce(v_r ->> 'cta_text', ''),
      coalesce(v_r ->> 'cta_url', ''),
      ((v_r -> 'range' ->> 0))::int,
      ((v_r -> 'range' ->> 1))::int
    )
    on conflict (id) do update set
      title_text = excluded.title_text,
      description = excluded.description,
      cta_text = excluded.cta_text,
      cta_url = excluded.cta_url,
      range_lo = excluded.range_lo,
      range_hi = excluded.range_hi;

    v_result_ids := v_result_ids || ((v_r ->> 'id')::uuid);
  end loop;

  -- Delete results removed from the quiz (also handles tag quizzes that send [])
  delete from public.result
  where quiz_id = v_quiz_id
    and id <> all(v_result_ids);

  return v_quiz_id;
end;
$$;
