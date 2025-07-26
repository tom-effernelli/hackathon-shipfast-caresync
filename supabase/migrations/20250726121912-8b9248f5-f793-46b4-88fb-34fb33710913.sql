-- Fix the get_current_user_role function to use medical_role column
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS medical_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT medical_role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;