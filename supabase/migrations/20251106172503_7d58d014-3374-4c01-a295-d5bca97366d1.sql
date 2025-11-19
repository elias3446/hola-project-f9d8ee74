-- Step 1: Delete orphaned records that don't have corresponding profiles
DELETE FROM user_hashtag_follows
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Step 2: Drop the existing foreign key constraint if it exists
ALTER TABLE user_hashtag_follows 
DROP CONSTRAINT IF EXISTS user_hashtag_follows_user_id_fkey;

-- Step 3: Add new foreign key constraint referencing profiles table
ALTER TABLE user_hashtag_follows
ADD CONSTRAINT user_hashtag_follows_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;