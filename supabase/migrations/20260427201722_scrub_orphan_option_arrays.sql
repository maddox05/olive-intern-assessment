set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.scrub_deleted_option_from_arrays()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  update public.questions_answered
  set selected_option_ids = array_remove(selected_option_ids, old.id)
  where selected_option_ids is not null
    and old.id = any(selected_option_ids);
  return old;
end;
$function$
;

CREATE TRIGGER option_after_delete_scrub_arrays AFTER DELETE ON public.option FOR EACH ROW EXECUTE FUNCTION public.scrub_deleted_option_from_arrays();


