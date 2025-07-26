-- Add missing columns to patients table for proper form submission handling
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS patient_submission_data JSONB,
ADD COLUMN IF NOT EXISTS injury_image_base64 TEXT,
ADD COLUMN IF NOT EXISTS aura_analysis_result JSONB;