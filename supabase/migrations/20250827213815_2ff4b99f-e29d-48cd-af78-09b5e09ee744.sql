-- Add foreign key relationship between pu_items and profiles via user_id
-- This will enable proper joins in queries
-- Note: We're just adding an index to help with the join, the relationship already exists via user_id

-- Add index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_pu_items_user_id ON public.pu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);