-- Secure function to hide a conversation for the current user
create or replace function public.hide_conversation_for_user(_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update participantes_conversacion
  set hidden_at = now()
  where conversacion_id = _conversation_id
    and user_id = get_profile_id_from_auth();
end;
$$;

revoke all on function public.hide_conversation_for_user(uuid) from public;
grant execute on function public.hide_conversation_for_user(uuid) to authenticated;