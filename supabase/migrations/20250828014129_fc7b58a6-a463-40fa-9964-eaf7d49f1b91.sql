-- Add nickname column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Ensure user_id is unique to allow reliable upserts/joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END$$;

-- Update handle_new_user to set nickname and name from auth metadata (nickname preferred)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  nick TEXT;
BEGIN
  nick := COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'name', NEW.email, 'User');

  INSERT INTO public.profiles (user_id, name, nickname)
  VALUES (NEW.id, nick, nick)
  ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        nickname = EXCLUDED.nickname,
        updated_at = now();

  RETURN NEW;
END;
$function$;

-- Create trigger to populate profiles when a new auth user is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;
