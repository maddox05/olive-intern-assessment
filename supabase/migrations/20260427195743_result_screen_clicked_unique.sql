CREATE UNIQUE INDEX result_screen_clicked_session_id_result_id_key ON public.result_screen_clicked USING btree (session_id, result_id);

alter table "public"."result_screen_clicked" add constraint "result_screen_clicked_session_id_result_id_key" UNIQUE using index "result_screen_clicked_session_id_result_id_key";


