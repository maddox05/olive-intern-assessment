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
        ), per_session_score AS (
         SELECT all_contributions.session_id,
            (COALESCE(sum(all_contributions.score), (0)::bigint))::integer AS total_score
           FROM all_contributions
          GROUP BY all_contributions.session_id
        ), per_session_tags AS (
         SELECT ac.session_id,
            jsonb_object_agg(t.tag, t.cnt) AS tag_counts
           FROM (( SELECT all_contributions.session_id,
                    tag.tag,
                    count(*) AS cnt
                   FROM all_contributions,
                    LATERAL unnest(all_contributions.tags) tag(tag)
                  GROUP BY all_contributions.session_id, tag.tag) t
             JOIN all_contributions ac ON ((ac.session_id = t.session_id)))
          GROUP BY ac.session_id
        )
 SELECT s.id AS session_id,
    s.quiz_id,
    s.start_time,
    s.end_time,
    COALESCE(pss.total_score, 0) AS total_score,
    COALESCE(pst.tag_counts, '{}'::jsonb) AS tag_counts
   FROM ((public.session s
     LEFT JOIN per_session_score pss ON ((pss.session_id = s.id)))
     LEFT JOIN per_session_tags pst ON ((pst.session_id = s.id)));



