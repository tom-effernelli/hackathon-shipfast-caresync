
-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  medical_history TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'self_checkin' CHECK (workflow_status IN ('self_checkin', 'clinical_assessment', 'in_treatment')),
  urgency_level TEXT CHECK (urgency_level IN ('critical', 'high', 'moderate', 'low')),
  estimated_wait_time INTEGER,
  estimated_treatment_duration INTEGER,
  assigned_doctor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample doctors
INSERT INTO public.doctors (name, specialty, availability) VALUES
  ('Dr. Sarah Johnson', 'Emergency Medicine', true),
  ('Dr. Michael Chen', 'Internal Medicine', true),
  ('Dr. Emily Rodriguez', 'Cardiology', true),
  ('Dr. David Kim', 'Orthopedics', false),
  ('Dr. Lisa Thompson', 'Neurology', true),
  ('Dr. James Wilson', 'Emergency Medicine', true),
  ('Dr. Maria Garcia', 'Pediatrics', true),
  ('Dr. Robert Brown', 'Surgery', true),
  ('Dr. Jennifer Davis', 'Radiology', false),
  ('Dr. Thomas Miller', 'Anesthesiology', true),
  ('Dr. Amanda White', 'Emergency Medicine', true),
  ('Dr. Christopher Lee', 'Gastroenterology', true),
  ('Dr. Michelle Taylor', 'Dermatology', true),
  ('Dr. Daniel Anderson', 'Psychiatry', true),
  ('Dr. Laura Martinez', 'Obstetrics', false);

-- Insert some sample patients
INSERT INTO public.patients (name, age, medical_history, workflow_status, urgency_level, estimated_wait_time, estimated_treatment_duration, assigned_doctor) VALUES
  ('John Smith', 45, 'Diabetes, Hypertension', 'self_checkin', 'moderate', 20, 30, NULL),
  ('Emma Johnson', 67, 'Heart disease, Previous stroke', 'clinical_assessment', 'critical', 5, 45, 'Dr. Emily Rodriguez'),
  ('Michael Brown', 32, 'Asthma', 'in_treatment', 'low', 0, 25, 'Dr. Sarah Johnson'),
  ('Sarah Davis', 54, 'High cholesterol', 'self_checkin', 'low', 35, 20, NULL),
  ('Robert Wilson', 78, 'COPD, Diabetes', 'clinical_assessment', 'high', 10, 40, 'Dr. Michael Chen'),
  ('Lisa Garcia', 29, 'Pregnancy complications', 'in_treatment', 'high', 0, 60, 'Dr. Laura Martinez'),
  ('David Miller', 41, 'Back injury', 'self_checkin', 'moderate', 25, 35, NULL),
  ('Jennifer Taylor', 35, 'Migraine history', 'clinical_assessment', 'moderate', 15, 30, 'Dr. Lisa Thompson'),
  ('Christopher Lee', 52, 'Chest pain', 'clinical_assessment', 'critical', 3, 50, 'Dr. Emily Rodriguez'),
  ('Amanda White', 63, 'Shortness of breath', 'in_treatment', 'high', 0, 35, 'Dr. James Wilson'),
  ('Daniel Martinez', 27, 'Sports injury', 'self_checkin', 'low', 45, 25, NULL),
  ('Michelle Anderson', 38, 'Severe headache', 'clinical_assessment', 'moderate', 18, 30, 'Dr. Lisa Thompson'),
  ('Thomas Thompson', 56, 'Abdominal pain', 'clinical_assessment', 'high', 8, 40, 'Dr. Christopher Lee'),
  ('Laura Rodriguez', 44, 'Allergic reaction', 'in_treatment', 'moderate', 0, 20, 'Dr. Amanda White'),
  ('James Kim', 71, 'Fall, possible fracture', 'clinical_assessment', 'high', 12, 45, 'Dr. David Kim');
