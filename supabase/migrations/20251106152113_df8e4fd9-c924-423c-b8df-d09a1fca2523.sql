-- Función para crear notificaciones de interacciones (me_gusta)
CREATE OR REPLACE FUNCTION public.crear_notificacion_interaccion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_autor_id UUID;
  v_usuario_nombre TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
BEGIN
  -- Obtener nombre del usuario que dio like
  SELECT COALESCE(nombre_completo, email, username, name) INTO v_usuario_nombre
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Si es like en una publicación
  IF NEW.publicacion_id IS NOT NULL AND NEW.tipo_interaccion = 'me_gusta' THEN
    -- Obtener el autor de la publicación
    SELECT user_id INTO v_autor_id
    FROM publicaciones
    WHERE id = NEW.publicacion_id;
    
    -- No crear notificación si el usuario da like a su propia publicación
    IF v_autor_id = NEW.user_id THEN
      RETURN NEW;
    END IF;
    
    v_titulo := '❤️ Nuevo like en tu publicación';
    v_mensaje := v_usuario_nombre || ' le dio like a tu publicación';
    
  -- Si es like en un comentario
  ELSIF NEW.comentario_id IS NOT NULL AND NEW.tipo_interaccion = 'me_gusta' THEN
    -- Obtener el autor del comentario
    SELECT user_id INTO v_autor_id
    FROM comentarios
    WHERE id = NEW.comentario_id;
    
    -- No crear notificación si el usuario da like a su propio comentario
    IF v_autor_id = NEW.user_id THEN
      RETURN NEW;
    END IF;
    
    v_titulo := '❤️ Nuevo like en tu comentario';
    v_mensaje := v_usuario_nombre || ' le dio like a tu comentario';
  ELSE
    -- Otro tipo de interacción, no crear notificación por ahora
    RETURN NEW;
  END IF;
  
  -- Crear la notificación
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_autor_id,
    v_titulo,
    v_mensaje,
    'asignacion',
    jsonb_build_object(
      'publicacion_id', NEW.publicacion_id,
      'comentario_id', NEW.comentario_id,
      'usuario_id', NEW.user_id,
      'tipo', 'me_gusta'
    ),
    false
  );
  
  RETURN NEW;
END;
$$;

-- Función para crear notificaciones de comentarios
CREATE OR REPLACE FUNCTION public.crear_notificacion_comentario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_autor_id UUID;
  v_usuario_nombre TEXT;
  v_tipo_notificacion TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
BEGIN
  -- Obtener nombre del usuario que comentó
  SELECT COALESCE(nombre_completo, email, username, name) INTO v_usuario_nombre
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Si es respuesta a un comentario
  IF NEW.comentario_padre_id IS NOT NULL THEN
    -- Obtener el autor del comentario padre
    SELECT user_id INTO v_autor_id
    FROM comentarios
    WHERE id = NEW.comentario_padre_id;
    
    v_tipo_notificacion := 'actualizacion';
    v_titulo := '💬 Nueva respuesta a tu comentario';
    v_mensaje := v_usuario_nombre || ' respondió a tu comentario: "' || LEFT(NEW.contenido, 50) || '"';
  ELSE
    -- Es comentario en una publicación
    SELECT user_id INTO v_autor_id
    FROM publicaciones
    WHERE id = NEW.publicacion_id;
    
    v_tipo_notificacion := 'actualizacion';
    v_titulo := '💬 Nuevo comentario en tu publicación';
    v_mensaje := v_usuario_nombre || ' comentó: "' || LEFT(NEW.contenido, 50) || '"';
  END IF;
  
  -- No crear notificación si el usuario comenta en su propio contenido
  IF v_autor_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Crear la notificación
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_autor_id,
    v_titulo,
    v_mensaje,
    v_tipo_notificacion,
    jsonb_build_object(
      'comentario_id', NEW.id,
      'publicacion_id', NEW.publicacion_id,
      'comentario_padre_id', NEW.comentario_padre_id,
      'usuario_id', NEW.user_id,
      'tipo', CASE WHEN NEW.comentario_padre_id IS NOT NULL THEN 'respuesta' ELSE 'comentario' END
    ),
    false
  );
  
  RETURN NEW;
END;
$$;

-- Crear trigger para interacciones (likes)
DROP TRIGGER IF EXISTS trigger_notificacion_interaccion ON interacciones;
CREATE TRIGGER trigger_notificacion_interaccion
  AFTER INSERT ON interacciones
  FOR EACH ROW
  EXECUTE FUNCTION crear_notificacion_interaccion();

-- Crear trigger para comentarios
DROP TRIGGER IF EXISTS trigger_notificacion_comentario ON comentarios;
CREATE TRIGGER trigger_notificacion_comentario
  AFTER INSERT ON comentarios
  FOR EACH ROW
  EXECUTE FUNCTION crear_notificacion_comentario();