-- Add a column to track if a conversation is hidden only from "Todos" section
-- This allows groups to remain visible in "Mis Grupos" even when hidden from "Todos"
alter table public.participantes_conversacion
add column if not exists hidden_from_all boolean default false;

-- Drop and recreate the hide_conversation_for_user function
drop function if exists public.hide_conversation_for_user(uuid);

create function public.hide_conversation_for_user(_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile_id uuid := get_profile_id_from_auth();
  _is_grupo boolean;
  _updated int;
begin
  if _profile_id is null then
    raise exception 'not authenticated';
  end if;

  -- Check if it's a group conversation
  select es_grupo into _is_grupo
  from public.conversaciones
  where id = _conversation_id;

  if _is_grupo then
    -- For groups, only hide from "Todos" section, keep in "Mis Grupos"
    update public.participantes_conversacion
    set hidden_from_all = true
    where conversacion_id = _conversation_id
      and user_id = _profile_id;
  else
    -- For individual conversations, hide completely
    update public.participantes_conversacion
    set hidden_at = now()
    where conversacion_id = _conversation_id
      and user_id = _profile_id;
  end if;

  get diagnostics _updated = row_count;

  return _updated > 0;
end;
$$;

-- Ensure only authenticated users can execute it
revoke all on function public.hide_conversation_for_user(uuid) from public;
grant execute on function public.hide_conversation_for_user(uuid) to authenticated;