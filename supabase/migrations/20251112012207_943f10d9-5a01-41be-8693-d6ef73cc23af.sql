-- Allow viewing group conversations even if hidden in "Todos"
create policy "Participants can view group conversations (including hidden)"
on public.conversaciones
for select
using (
  es_grupo = true
  and is_conversation_participant(id, get_profile_id_from_auth())
);
