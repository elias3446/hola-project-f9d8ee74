-- Add unique constraint to prevent duplicate reactions
-- This ensures a user can only react once with the same emoji on the same message
ALTER TABLE mensaje_reacciones 
ADD CONSTRAINT mensaje_reacciones_unique_user_emoji 
UNIQUE (mensaje_id, user_id, emoji);