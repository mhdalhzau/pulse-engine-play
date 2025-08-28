-- First, create missing profiles for existing users in laporan_harian and pu_items
INSERT INTO public.profiles (user_id, name, nickname)
SELECT DISTINCT 
  user_id, 
  'User ' || SUBSTRING(user_id::text, 1, 8),
  'User ' || SUBSTRING(user_id::text, 1, 8)
FROM public.laporan_harian
WHERE user_id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.profiles (user_id, name, nickname)
SELECT DISTINCT 
  user_id, 
  'User ' || SUBSTRING(user_id::text, 1, 8),
  'User ' || SUBSTRING(user_id::text, 1, 8)
FROM public.pu_items
WHERE user_id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Now add the foreign key constraints
ALTER TABLE public.laporan_harian 
ADD CONSTRAINT fk_laporan_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.pu_items 
ADD CONSTRAINT fk_pu_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON public.laporan_harian(user_id);
CREATE INDEX IF NOT EXISTS idx_pu_items_user_id ON public.pu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);