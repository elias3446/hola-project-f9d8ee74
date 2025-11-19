-- Corregir función notify_reporte_changes para permitir auto-notificaciones
CREATE OR REPLACE FUNCTION public.notify_reporte_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  action_user_id UUID;
  reporte_nombre TEXT;
  assigned_user_name TEXT;
  creator_name TEXT;
BEGIN
  action_user_id := auth.uid();
  reporte_nombre := NEW.nombre;
  
  IF TG_OP = 'INSERT' THEN
    -- Notificar al creador
    PERFORM create_notification(
      NEW.user_id,
      'exito',
      'Reporte creado',
      'Tu reporte "' || reporte_nombre || '" ha sido creado',
      jsonb_build_object('reporte_id', NEW.id, 'action', 'CREATE', 'status', NEW.status)
    );
    
    -- Si se asignó a alguien desde el inicio (incluida auto-asignación)
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT name INTO assigned_user_name FROM profiles WHERE id = NEW.assigned_to;
      
      PERFORM create_notification(
        NEW.assigned_to,
        'asignacion',
        'Reporte asignado',
        'Se te ha asignado el reporte "' || reporte_nombre || '"',
        jsonb_build_object('reporte_id', NEW.id, 'action', 'ASSIGNED', 'status', NEW.status)
      );
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    
    -- Verificar SOFT DELETE
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      -- Notificar al creador
      PERFORM create_notification(
        NEW.user_id,
        'advertencia',
        'Reporte eliminado',
        'Tu reporte "' || reporte_nombre || '" ha sido eliminado',
        jsonb_build_object('reporte_id', NEW.id, 'action', 'SOFT_DELETE')
      );
      
      -- Notificar a quien lo eliminó (si es diferente)
      IF action_user_id IS NOT NULL AND action_user_id != NEW.user_id THEN
        PERFORM create_notification(
          action_user_id,
          'informacion',
          'Reporte eliminado',
          'Has eliminado el reporte "' || reporte_nombre || '"',
          jsonb_build_object('reporte_id', NEW.id, 'action', 'SOFT_DELETE')
        );
      END IF;
      
      RETURN NEW;
    END IF;
    
    -- Verificar cambio de ASIGNACIÓN
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      
      -- Desasignación (asignado a NULL)
      IF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
        PERFORM create_notification(
          OLD.assigned_to,
          'informacion',
          'Reporte desasignado',
          'El reporte "' || reporte_nombre || '" te ha sido desasignado',
          jsonb_build_object('reporte_id', NEW.id, 'action', 'UNASSIGNED')
        );
        
      -- Reasignación (cambio de un usuario a otro)
      ELSIF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NOT NULL THEN
        -- Notificar al anterior asignado
        PERFORM create_notification(
          OLD.assigned_to,
          'informacion',
          'Reporte reasignado',
          'El reporte "' || reporte_nombre || '" ha sido reasignado',
          jsonb_build_object('reporte_id', NEW.id, 'action', 'REASSIGNED')
        );
        
        -- Notificar al nuevo asignado (incluida auto-asignación)
        PERFORM create_notification(
          NEW.assigned_to,
          'asignacion',
          'Reporte asignado',
          'Se te ha asignado el reporte "' || reporte_nombre || '"',
          jsonb_build_object('reporte_id', NEW.id, 'action', 'ASSIGNED', 'status', NEW.status)
        );
        
      -- Nueva asignación (de NULL a alguien, incluida auto-asignación)
      ELSIF OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
        PERFORM create_notification(
          NEW.assigned_to,
          'asignacion',
          'Reporte asignado',
          'Se te ha asignado el reporte "' || reporte_nombre || '"',
          jsonb_build_object('reporte_id', NEW.id, 'action', 'ASSIGNED', 'status', NEW.status)
        );
      END IF;
    END IF;
    
    -- Verificar cambio de ESTADO
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Notificar al creador del reporte
      PERFORM create_notification(
        NEW.user_id,
        'actualizacion',
        'Estado del reporte actualizado',
        'Tu reporte "' || reporte_nombre || '" cambió a estado: ' || NEW.status,
        jsonb_build_object('reporte_id', NEW.id, 'action', 'STATUS_CHANGE', 'old_status', OLD.status, 'new_status', NEW.status)
      );
      
      -- Notificar al asignado si es diferente del creador
      IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.user_id THEN
        PERFORM create_notification(
          NEW.assigned_to,
          'actualizacion',
          'Estado del reporte actualizado',
          'El reporte asignado "' || reporte_nombre || '" cambió a estado: ' || NEW.status,
          jsonb_build_object('reporte_id', NEW.id, 'action', 'STATUS_CHANGE', 'old_status', OLD.status, 'new_status', NEW.status)
        );
      END IF;
    END IF;
    
    -- Verificar cambio de PRIORIDAD
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      -- Notificar al creador
      PERFORM create_notification(
        NEW.user_id,
        'actualizacion',
        'Prioridad actualizada',
        'La prioridad de tu reporte "' || reporte_nombre || '" cambió a: ' || NEW.priority,
        jsonb_build_object('reporte_id', NEW.id, 'action', 'PRIORITY_CHANGE', 'old_priority', OLD.priority, 'new_priority', NEW.priority)
      );
      
      -- Notificar al asignado si es diferente del creador
      IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.user_id THEN
        PERFORM create_notification(
          NEW.assigned_to,
          'actualizacion',
          'Prioridad actualizada',
          'La prioridad del reporte asignado "' || reporte_nombre || '" cambió a: ' || NEW.priority,
          jsonb_build_object('reporte_id', NEW.id, 'action', 'PRIORITY_CHANGE', 'old_priority', OLD.priority, 'new_priority', NEW.priority)
        );
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;