-- Function to clear all messages in a conversation for the current user
create or replace function public.clear_messages_for_user(_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Add current user to hidden_by_users array for all messages in the conversation
  update mensajes
  set hidden_by_users = 
    case 
      when hidden_by_users is null then jsonb_build_array(get_profile_id_from_auth())
      when not (hidden_by_users @> jsonb_build_array(get_profile_id_from_auth())) 
        then hidden_by_users || jsonb_build_array(get_profile_id_from_auth())
      else hidden_by_users
    end
  where conversacion_id = _conversation_id
    and user_id != get_profile_id_from_auth()  -- Don't hide own messages from self in this context
    and (deleted_at is null or deleted_at is not null);  -- All messages
end;
$$;

revoke all on function public.clear_messages_for_user(uuid) from public;
grant execute on function public.clear_messages_for_user(uuid) to authenticated;