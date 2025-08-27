-- Create profiles table for user names
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create PU items table for daily PU tracking
CREATE TABLE public.pu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tanggal TEXT NOT NULL,
  shift INTEGER NOT NULL,
  keterangan TEXT NOT NULL,
  nominal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pu_items
ALTER TABLE public.pu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for pu_items
CREATE POLICY "Users can view their own PU items" ON public.pu_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own PU items" ON public.pu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PU items" ON public.pu_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own PU items" ON public.pu_items FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updating timestamps on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating timestamps on pu_items
CREATE TRIGGER update_pu_items_updated_at
  BEFORE UPDATE ON public.pu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'));
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();