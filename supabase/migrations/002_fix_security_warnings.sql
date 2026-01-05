-- Fix Supabase database linter security warnings
-- Addresses: function_search_path_mutable for 3 functions

-- 1. Fix get_user_org_ids - add search_path
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(ARRAY_AGG(org_id), ARRAY[]::UUID[])
  FROM public.user_organizations
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- 2. Fix handle_new_user - add search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'therapist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- 3. Fix update_updated_at - add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
