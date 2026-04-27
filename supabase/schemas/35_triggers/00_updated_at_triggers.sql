create trigger quiz_set_updated_at
  before update on public.quiz
  for each row execute function public.set_updated_at();

create trigger question_set_updated_at
  before update on public.question
  for each row execute function public.set_updated_at();

create trigger option_set_updated_at
  before update on public.option
  for each row execute function public.set_updated_at();

create trigger result_set_updated_at
  before update on public.result
  for each row execute function public.set_updated_at();

create trigger session_set_updated_at
  before update on public.session
  for each row execute function public.set_updated_at();

create trigger questions_answered_set_updated_at
  before update on public.questions_answered
  for each row execute function public.set_updated_at();
