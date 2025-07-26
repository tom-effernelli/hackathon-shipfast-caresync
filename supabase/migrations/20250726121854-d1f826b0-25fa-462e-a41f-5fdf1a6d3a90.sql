-- PHASE 1: EMERGENCY DATABASE LOCKDOWN
-- Enable Row Level Security on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- PHASE 2: USER ROLES AND PROFILES SYSTEM
-- Create enum for medical staff roles
CREATE TYPE public.medical_role AS ENUM ('doctor', 'nurse', 'admin');

-- Create profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  medical_role medical_role NOT NULL DEFAULT 'nurse',
  department TEXT,
  license_number TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for granular permissions
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role medical_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- PHASE 3: AUDIT LOGGING TABLE
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PHASE 4: SECURITY DEFINER FUNCTIONS
-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role medical_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS medical_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- PHASE 5: ROW LEVEL SECURITY POLICIES

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin());

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin());

-- Patients policies - Medical staff only
CREATE POLICY "Medical staff can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() IN ('doctor', 'nurse', 'admin')
);

CREATE POLICY "Medical staff can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('doctor', 'nurse', 'admin')
);

CREATE POLICY "Doctors and admins can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() IN ('doctor', 'admin')
);

CREATE POLICY "Admins can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Doctors policies
CREATE POLICY "Medical staff can view doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() IN ('doctor', 'nurse', 'admin')
);

CREATE POLICY "Admins can manage doctors"
ON public.doctors
FOR ALL
TO authenticated
USING (public.is_admin());

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PHASE 6: TRIGGERS FOR AUDIT LOGGING
-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for patients table
CREATE TRIGGER patients_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- Create audit triggers for doctors table  
CREATE TRIGGER doctors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- PHASE 7: UPDATED_AT TRIGGERS
-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (will need to be created manually)
-- This creates a placeholder that needs to be linked to actual auth user
INSERT INTO public.profiles (user_id, full_name, medical_role, department) 
VALUES ('00000000-0000-0000-0000-000000000000', 'System Admin', 'admin', 'Administration')
ON CONFLICT (user_id) DO NOTHING;