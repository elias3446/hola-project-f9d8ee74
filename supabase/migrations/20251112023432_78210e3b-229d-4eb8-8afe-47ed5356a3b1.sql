-- Create a secure RPC to leave a group without RLS conflicts
create or replace function public.leave_group_for_user(_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile_id uuid := get_profile_id_from_auth();
  _deleted int;
begin
  if _profile_id is null then
    raise exception 'not authenticated';
  end if;

  -- Remove the participant from the conversation
  delete from public.participantes_conversacion
  where conversacion_id = _conversation_id
    and user_id = _profile_id;

  get diagnostics _deleted = row_count;

  if _deleted = 0 then
    return false; -- user was not a participant or already left
  end if;

  -- Best-effort: record history (ignore any errors)
  begin
    insert into public.group_history (conversacion_id, action_type, performed_by, affected_user_id)
    values (_conversation_id, 'member_left', _profile_id, _profile_id);
  exception when others then
    -- ignore
    null;
  end;

  return true;
end;
$$;

-- Ensure only authenticated users can execute it
revoke all on function public.leave_group_for_user(uuid) from public;
grant execute on function public.leave_group_for_user(uuid) to authenticated;