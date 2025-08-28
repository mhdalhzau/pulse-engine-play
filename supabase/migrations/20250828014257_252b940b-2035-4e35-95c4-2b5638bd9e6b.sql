-- Add proper foreign key constraints for better relationships
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