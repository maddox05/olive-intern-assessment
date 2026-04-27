-- When an option is deleted, FKs cascade rows that referenced it via
-- `option_chosen_id`. But `selected_option_ids` is a uuid[] with no FK on
-- elements, so the deleted UUIDs would linger in historical select_multiple
-- answers (silent shrinking when joined back via `o.id = any(...)`).
-- This trigger scrubs the deleted id from any array that still mentions it.
create or replace function public.scrub_deleted_option_from_arrays()
returns trigger
language plpgsql
as $$
begin
  update public.questions_answered
  set selected_option_ids = array_remove(selected_option_ids, old.id)
  where selected_option_ids is not null
    and old.id = any(selected_option_ids);
  return old;
end;
$$;
