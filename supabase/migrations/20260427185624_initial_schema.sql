create type "public"."question_type" as enum ('multiple_choice', 'select_multiple', 'slider');

create type "public"."quiz_type" as enum ('score', 'card', 'tag');


  create table "public"."option" (
    "id" uuid not null default gen_random_uuid(),
    "question_id" uuid not null,
    "text" text not null,
    "score" integer,
    "tags" text[] not null default '{}'::text[],
    "position" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."question" (
    "id" uuid not null default gen_random_uuid(),
    "quiz_id" uuid not null,
    "text" text not null,
    "type" public.question_type not null,
    "position" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."questions_answered" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "question_id" uuid not null,
    "option_chosen_id" uuid,
    "numeric_answer" integer,
    "selected_option_ids" uuid[],
    "answered_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."quiz" (
    "id" uuid not null default gen_random_uuid(),
    "type" public.quiz_type not null,
    "title" text not null,
    "description" text not null default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."result" (
    "id" uuid not null default gen_random_uuid(),
    "quiz_id" uuid not null,
    "title_text" text not null,
    "description" text not null default ''::text,
    "cta_text" text not null default ''::text,
    "cta_url" text not null default ''::text,
    "range_lo" integer not null,
    "range_hi" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."result_screen_clicked" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "result_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."session" (
    "id" uuid not null default gen_random_uuid(),
    "quiz_id" uuid not null,
    "start_time" timestamp with time zone not null default now(),
    "end_time" timestamp with time zone,
    "device" text,
    "browser" text,
    "referrer" text,
    "user_agent" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX option_pkey ON public.option USING btree (id);

CREATE INDEX option_question_id_idx ON public.option USING btree (question_id, "position");

CREATE UNIQUE INDEX question_pkey ON public.question USING btree (id);

CREATE INDEX question_quiz_id_idx ON public.question USING btree (quiz_id, "position");

CREATE UNIQUE INDEX questions_answered_pkey ON public.questions_answered USING btree (id);

CREATE INDEX questions_answered_question_idx ON public.questions_answered USING btree (question_id);

CREATE INDEX questions_answered_session_idx ON public.questions_answered USING btree (session_id, answered_at);

CREATE INDEX quiz_created_at_idx ON public.quiz USING btree (created_at DESC);

CREATE UNIQUE INDEX quiz_pkey ON public.quiz USING btree (id);

CREATE UNIQUE INDEX result_pkey ON public.result USING btree (id);

CREATE INDEX result_quiz_id_idx ON public.result USING btree (quiz_id, range_lo);

CREATE UNIQUE INDEX result_screen_clicked_pkey ON public.result_screen_clicked USING btree (id);

CREATE INDEX result_screen_clicked_result_idx ON public.result_screen_clicked USING btree (result_id);

CREATE INDEX result_screen_clicked_session_idx ON public.result_screen_clicked USING btree (session_id);

CREATE INDEX session_completion_idx ON public.session USING btree (quiz_id, end_time);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);

CREATE INDEX session_quiz_id_idx ON public.session USING btree (quiz_id, start_time DESC);

alter table "public"."option" add constraint "option_pkey" PRIMARY KEY using index "option_pkey";

alter table "public"."question" add constraint "question_pkey" PRIMARY KEY using index "question_pkey";

alter table "public"."questions_answered" add constraint "questions_answered_pkey" PRIMARY KEY using index "questions_answered_pkey";

alter table "public"."quiz" add constraint "quiz_pkey" PRIMARY KEY using index "quiz_pkey";

alter table "public"."result" add constraint "result_pkey" PRIMARY KEY using index "result_pkey";

alter table "public"."result_screen_clicked" add constraint "result_screen_clicked_pkey" PRIMARY KEY using index "result_screen_clicked_pkey";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."option" add constraint "option_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.question(id) ON DELETE CASCADE not valid;

alter table "public"."option" validate constraint "option_question_id_fkey";

alter table "public"."question" add constraint "question_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE not valid;

alter table "public"."question" validate constraint "question_quiz_id_fkey";

alter table "public"."questions_answered" add constraint "exactly_one_answer" CHECK ((((
CASE
    WHEN (option_chosen_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (numeric_answer IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (selected_option_ids IS NOT NULL) THEN 1
    ELSE 0
END) = 1)) not valid;

alter table "public"."questions_answered" validate constraint "exactly_one_answer";

alter table "public"."questions_answered" add constraint "questions_answered_option_chosen_id_fkey" FOREIGN KEY (option_chosen_id) REFERENCES public.option(id) ON DELETE CASCADE not valid;

alter table "public"."questions_answered" validate constraint "questions_answered_option_chosen_id_fkey";

alter table "public"."questions_answered" add constraint "questions_answered_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.question(id) ON DELETE CASCADE not valid;

alter table "public"."questions_answered" validate constraint "questions_answered_question_id_fkey";

alter table "public"."questions_answered" add constraint "questions_answered_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.session(id) ON DELETE CASCADE not valid;

alter table "public"."questions_answered" validate constraint "questions_answered_session_id_fkey";

alter table "public"."result" add constraint "result_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE not valid;

alter table "public"."result" validate constraint "result_quiz_id_fkey";

alter table "public"."result" add constraint "result_range_valid" CHECK ((range_lo <= range_hi)) not valid;

alter table "public"."result" validate constraint "result_range_valid";

alter table "public"."result_screen_clicked" add constraint "result_screen_clicked_result_id_fkey" FOREIGN KEY (result_id) REFERENCES public.result(id) ON DELETE CASCADE not valid;

alter table "public"."result_screen_clicked" validate constraint "result_screen_clicked_result_id_fkey";

alter table "public"."result_screen_clicked" add constraint "result_screen_clicked_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.session(id) ON DELETE CASCADE not valid;

alter table "public"."result_screen_clicked" validate constraint "result_screen_clicked_session_id_fkey";

alter table "public"."session" add constraint "session_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_quiz_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.apply_quiz_diff(p_quiz jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."session_outcome" as  WITH chosen_options AS (
         SELECT qa.session_id,
            qa.question_id,
            o.score,
            o.tags
           FROM (public.questions_answered qa
             JOIN public.option o ON ((o.id = qa.option_chosen_id)))
          WHERE (qa.option_chosen_id IS NOT NULL)
        UNION ALL
         SELECT qa.session_id,
            qa.question_id,
            o.score,
            o.tags
           FROM (public.questions_answered qa
             JOIN public.option o ON ((o.id = ANY (qa.selected_option_ids))))
          WHERE (qa.selected_option_ids IS NOT NULL)
        ), slider_answers AS (
         SELECT qa.session_id,
            qa.numeric_answer AS score,
            '{}'::text[] AS tags
           FROM public.questions_answered qa
          WHERE (qa.numeric_answer IS NOT NULL)
        ), all_contributions AS (
         SELECT chosen_options.session_id,
            chosen_options.score,
            chosen_options.tags
           FROM chosen_options
        UNION ALL
         SELECT slider_answers.session_id,
            slider_answers.score,
            slider_answers.tags
           FROM slider_answers
        ), per_session AS (
         SELECT all_contributions.session_id,
            (COALESCE(sum(all_contributions.score), (0)::bigint))::integer AS total_score,
            array_agg(t.t) FILTER (WHERE (t.t IS NOT NULL)) AS flat_tags
           FROM all_contributions,
            LATERAL unnest(COALESCE(all_contributions.tags, '{}'::text[])) t(t)
          GROUP BY all_contributions.session_id
        )
 SELECT s.id AS session_id,
    s.quiz_id,
    s.start_time,
    s.end_time,
    COALESCE(ps.total_score, 0) AS total_score,
    COALESCE(( SELECT jsonb_object_agg(t.tag, t.cnt) AS jsonb_object_agg
           FROM ( SELECT tag.tag,
                    count(*) AS cnt
                   FROM unnest(COALESCE(ps.flat_tags, '{}'::text[])) tag(tag)
                  GROUP BY tag.tag) t), '{}'::jsonb) AS tag_counts
   FROM (public.session s
     LEFT JOIN per_session ps ON ((ps.session_id = s.id)));


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."option" to "anon";

grant insert on table "public"."option" to "anon";

grant references on table "public"."option" to "anon";

grant select on table "public"."option" to "anon";

grant trigger on table "public"."option" to "anon";

grant truncate on table "public"."option" to "anon";

grant update on table "public"."option" to "anon";

grant delete on table "public"."option" to "authenticated";

grant insert on table "public"."option" to "authenticated";

grant references on table "public"."option" to "authenticated";

grant select on table "public"."option" to "authenticated";

grant trigger on table "public"."option" to "authenticated";

grant truncate on table "public"."option" to "authenticated";

grant update on table "public"."option" to "authenticated";

grant delete on table "public"."option" to "service_role";

grant insert on table "public"."option" to "service_role";

grant references on table "public"."option" to "service_role";

grant select on table "public"."option" to "service_role";

grant trigger on table "public"."option" to "service_role";

grant truncate on table "public"."option" to "service_role";

grant update on table "public"."option" to "service_role";

grant delete on table "public"."question" to "anon";

grant insert on table "public"."question" to "anon";

grant references on table "public"."question" to "anon";

grant select on table "public"."question" to "anon";

grant trigger on table "public"."question" to "anon";

grant truncate on table "public"."question" to "anon";

grant update on table "public"."question" to "anon";

grant delete on table "public"."question" to "authenticated";

grant insert on table "public"."question" to "authenticated";

grant references on table "public"."question" to "authenticated";

grant select on table "public"."question" to "authenticated";

grant trigger on table "public"."question" to "authenticated";

grant truncate on table "public"."question" to "authenticated";

grant update on table "public"."question" to "authenticated";

grant delete on table "public"."question" to "service_role";

grant insert on table "public"."question" to "service_role";

grant references on table "public"."question" to "service_role";

grant select on table "public"."question" to "service_role";

grant trigger on table "public"."question" to "service_role";

grant truncate on table "public"."question" to "service_role";

grant update on table "public"."question" to "service_role";

grant delete on table "public"."questions_answered" to "anon";

grant insert on table "public"."questions_answered" to "anon";

grant references on table "public"."questions_answered" to "anon";

grant select on table "public"."questions_answered" to "anon";

grant trigger on table "public"."questions_answered" to "anon";

grant truncate on table "public"."questions_answered" to "anon";

grant update on table "public"."questions_answered" to "anon";

grant delete on table "public"."questions_answered" to "authenticated";

grant insert on table "public"."questions_answered" to "authenticated";

grant references on table "public"."questions_answered" to "authenticated";

grant select on table "public"."questions_answered" to "authenticated";

grant trigger on table "public"."questions_answered" to "authenticated";

grant truncate on table "public"."questions_answered" to "authenticated";

grant update on table "public"."questions_answered" to "authenticated";

grant delete on table "public"."questions_answered" to "service_role";

grant insert on table "public"."questions_answered" to "service_role";

grant references on table "public"."questions_answered" to "service_role";

grant select on table "public"."questions_answered" to "service_role";

grant trigger on table "public"."questions_answered" to "service_role";

grant truncate on table "public"."questions_answered" to "service_role";

grant update on table "public"."questions_answered" to "service_role";

grant delete on table "public"."quiz" to "anon";

grant insert on table "public"."quiz" to "anon";

grant references on table "public"."quiz" to "anon";

grant select on table "public"."quiz" to "anon";

grant trigger on table "public"."quiz" to "anon";

grant truncate on table "public"."quiz" to "anon";

grant update on table "public"."quiz" to "anon";

grant delete on table "public"."quiz" to "authenticated";

grant insert on table "public"."quiz" to "authenticated";

grant references on table "public"."quiz" to "authenticated";

grant select on table "public"."quiz" to "authenticated";

grant trigger on table "public"."quiz" to "authenticated";

grant truncate on table "public"."quiz" to "authenticated";

grant update on table "public"."quiz" to "authenticated";

grant delete on table "public"."quiz" to "service_role";

grant insert on table "public"."quiz" to "service_role";

grant references on table "public"."quiz" to "service_role";

grant select on table "public"."quiz" to "service_role";

grant trigger on table "public"."quiz" to "service_role";

grant truncate on table "public"."quiz" to "service_role";

grant update on table "public"."quiz" to "service_role";

grant delete on table "public"."result" to "anon";

grant insert on table "public"."result" to "anon";

grant references on table "public"."result" to "anon";

grant select on table "public"."result" to "anon";

grant trigger on table "public"."result" to "anon";

grant truncate on table "public"."result" to "anon";

grant update on table "public"."result" to "anon";

grant delete on table "public"."result" to "authenticated";

grant insert on table "public"."result" to "authenticated";

grant references on table "public"."result" to "authenticated";

grant select on table "public"."result" to "authenticated";

grant trigger on table "public"."result" to "authenticated";

grant truncate on table "public"."result" to "authenticated";

grant update on table "public"."result" to "authenticated";

grant delete on table "public"."result" to "service_role";

grant insert on table "public"."result" to "service_role";

grant references on table "public"."result" to "service_role";

grant select on table "public"."result" to "service_role";

grant trigger on table "public"."result" to "service_role";

grant truncate on table "public"."result" to "service_role";

grant update on table "public"."result" to "service_role";

grant delete on table "public"."result_screen_clicked" to "anon";

grant insert on table "public"."result_screen_clicked" to "anon";

grant references on table "public"."result_screen_clicked" to "anon";

grant select on table "public"."result_screen_clicked" to "anon";

grant trigger on table "public"."result_screen_clicked" to "anon";

grant truncate on table "public"."result_screen_clicked" to "anon";

grant update on table "public"."result_screen_clicked" to "anon";

grant delete on table "public"."result_screen_clicked" to "authenticated";

grant insert on table "public"."result_screen_clicked" to "authenticated";

grant references on table "public"."result_screen_clicked" to "authenticated";

grant select on table "public"."result_screen_clicked" to "authenticated";

grant trigger on table "public"."result_screen_clicked" to "authenticated";

grant truncate on table "public"."result_screen_clicked" to "authenticated";

grant update on table "public"."result_screen_clicked" to "authenticated";

grant delete on table "public"."result_screen_clicked" to "service_role";

grant insert on table "public"."result_screen_clicked" to "service_role";

grant references on table "public"."result_screen_clicked" to "service_role";

grant select on table "public"."result_screen_clicked" to "service_role";

grant trigger on table "public"."result_screen_clicked" to "service_role";

grant truncate on table "public"."result_screen_clicked" to "service_role";

grant update on table "public"."result_screen_clicked" to "service_role";

grant delete on table "public"."session" to "anon";

grant insert on table "public"."session" to "anon";

grant references on table "public"."session" to "anon";

grant select on table "public"."session" to "anon";

grant trigger on table "public"."session" to "anon";

grant truncate on table "public"."session" to "anon";

grant update on table "public"."session" to "anon";

grant delete on table "public"."session" to "authenticated";

grant insert on table "public"."session" to "authenticated";

grant references on table "public"."session" to "authenticated";

grant select on table "public"."session" to "authenticated";

grant trigger on table "public"."session" to "authenticated";

grant truncate on table "public"."session" to "authenticated";

grant update on table "public"."session" to "authenticated";

grant delete on table "public"."session" to "service_role";

grant insert on table "public"."session" to "service_role";

grant references on table "public"."session" to "service_role";

grant select on table "public"."session" to "service_role";

grant trigger on table "public"."session" to "service_role";

grant truncate on table "public"."session" to "service_role";

grant update on table "public"."session" to "service_role";

CREATE TRIGGER option_set_updated_at BEFORE UPDATE ON public.option FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER question_set_updated_at BEFORE UPDATE ON public.question FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER questions_answered_set_updated_at BEFORE UPDATE ON public.questions_answered FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER quiz_set_updated_at BEFORE UPDATE ON public.quiz FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER result_set_updated_at BEFORE UPDATE ON public.result FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER session_set_updated_at BEFORE UPDATE ON public.session FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


