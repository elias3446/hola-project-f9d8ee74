-- Eliminar políticas antiguas de notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Crear nuevas políticas usando profile.id
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own notifications"
ON notifications FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Actualizar políticas de settings
DROP POLICY IF EXISTS "Users can view their own settings" ON settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON settings;

CREATE POLICY "Users can view their own settings"
ON settings FOR SELECT
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own settings"
ON settings FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Actualizar políticas de user_audit
DROP POLICY IF EXISTS "Users can view their own audit logs" ON user_audit;

CREATE POLICY "Users can view their own audit logs"
ON user_audit FOR SELECT
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Actualizar políticas de user_roles
DROP POLICY IF EXISTS "Users with ver_usuario can view roles" ON user_roles;

CREATE POLICY "Users with ver_usuario can view roles"
ON user_roles FOR SELECT
USING (
  has_permission(
    (SELECT id FROM profiles WHERE user_id = auth.uid()), 
    'ver_usuario'::user_permission
  ) 
  OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);