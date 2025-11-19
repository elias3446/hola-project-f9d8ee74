-- Update the leave_group_for_user function to hide instead of delete
-- This preserves conversation history like WhatsApp
create or replace function public.leave_group_for_user(_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile_id uuid := get_profile_id_from_auth();
  _updated int;
begin
  if _profile_id is null then
    raise exception 'not authenticated';
  end if;

  -- Instead of deleting, mark as hidden so conversation history is preserved
  update public.participantes_conversacion
  set hidden_at = now()
  where conversacion_id = _conversation_id
    and user_id = _profile_id
    and hidden_at is null;

  get diagnostics _updated = row_count;

  if _updated = 0 then
    return false; -- user was not an active participant
  end if;

  -- Best-effort: record history (ignore any errors)
  begin
    insert into public.group_history (conversacion_id, action_type, performed_by, affected_user_id)
    values (_conversation_id, 'member_left', _profile_id, _profile_id);
  exception when others then
    null;
  end;

  return true;
end;
$$;

-- Update RLS policy for mensajes to allow viewing messages from groups user has left
drop policy if exists "Participantes pueden ver mensajes de conversaciones activas" on public.mensajes;

create policy "Participantes pueden ver mensajes incluidos de grupos abandonados"
on public.mensajes
for select
using (
  exists (
    select 1
    from participantes_conversacion
    where participantes_conversacion.conversacion_id = mensajes.conversacion_id
      and participantes_conversacion.user_id = get_profile_id_from_auth()
  )
  and deleted_at is null
  and not (hidden_by_users @> jsonb_build_array(get_profile_id_from_auth()))
);

-- Update conversations view policy to include left groups
drop policy if exists "Usuarios pueden ver sus conversaciones" on public.conversaciones;

create policy "Usuarios pueden ver sus conversaciones incluidas abandonadas"
on public.conversaciones
for select
using (
  exists (
    select 1
    from participantes_conversacion
    where participantes_conversacion.conversacion_id = conversaciones.id
      and participantes_conversacion.user_id = get_profile_id_from_auth()
  )
);