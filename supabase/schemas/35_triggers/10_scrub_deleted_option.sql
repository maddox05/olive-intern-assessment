create trigger option_after_delete_scrub_arrays
  after delete on public.option
  for each row execute function public.scrub_deleted_option_from_arrays();
