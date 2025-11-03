-- Fix function search_path warnings
-- Run this in Supabase SQL editor

-- 1. Drop and recreate functions with secure search_path

-- handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    FALSE
  );
  RETURN NEW;
END;
$$;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- set_updated_at function
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- create_user_profile function
DROP FUNCTION IF EXISTS public.create_user_profile CASCADE;
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_profiles (user_id, niche, industry)
    VALUES (NEW.id, 'general', 'general');
    RETURN NEW;
END;
$$;

-- update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_strategy_trending_hashtags_updated_at function
DROP FUNCTION IF EXISTS public.update_strategy_trending_hashtags_updated_at CASCADE;
CREATE OR REPLACE FUNCTION public.update_strategy_trending_hashtags_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_strategy_trending_keywords_updated_at function
DROP FUNCTION IF EXISTS public.update_strategy_trending_keywords_updated_at CASCADE;
CREATE OR REPLACE FUNCTION public.update_strategy_trending_keywords_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_strategy_trending_analysis_updated_at function
DROP FUNCTION IF EXISTS public.update_strategy_trending_analysis_updated_at CASCADE;
CREATE OR REPLACE FUNCTION public.update_strategy_trending_analysis_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Verify all triggers are still intact
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
