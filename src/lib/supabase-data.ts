import { supabase } from '@/integrations/supabase/client'

export interface Patient {
  id: string
  name: string
  age: number
  gender?: string
  phone_number?: string
  medical_history?: string
  workflow_status: 'self_checkin' | 'clinical_assessment' | 'in_treatment'
  urgency_level?: 'critical' | 'high' | 'moderate' | 'low'
  estimated_wait_time?: number
  estimated_treatment_duration?: number
  assigned_doctor?: string
  patient_submission_data?: any
  injury_image_base64?: string
  aura_analysis_result?: any
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  availability: boolean
  created_at: string
}

// Fetch all patients
export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
    throw error
  }

  return (data || []).map(patient => ({
    ...patient,
    workflow_status: patient.workflow_status as Patient['workflow_status'],
    urgency_level: patient.urgency_level as Patient['urgency_level']
  }))
}

// Add new patient
export async function addPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert([{
      ...patient,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error adding patient:', error)
    throw error
  }

  return {
    ...data,
    workflow_status: data.workflow_status as Patient['workflow_status'],
    urgency_level: data.urgency_level as Patient['urgency_level']
  }
}

// Update patient workflow status
export async function updatePatientStatus(patientId: string, status: Patient['workflow_status'], updates?: Partial<Patient>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update({
      workflow_status: status,
      updated_at: new Date().toISOString(),
      ...updates
    })
    .eq('id', patientId)
    .select()
    .single()

  if (error) {
    console.error('Error updating patient status:', error)
    throw error
  }

  return {
    ...data,
    workflow_status: data.workflow_status as Patient['workflow_status'],
    urgency_level: data.urgency_level as Patient['urgency_level']
  }
}

// Fetch doctors
export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching doctors:', error)
    throw error
  }

  return data || []
}

// AI-powered functions (mock implementations)
export async function rankPatients(patients: Patient[]): Promise<Patient[]> {
  // Mock AI ranking based on urgency
  return patients.sort((a, b) => {
    const urgencyOrder = { critical: 4, high: 3, moderate: 2, low: 1 }
    const aScore = urgencyOrder[a.urgency_level || 'low']
    const bScore = urgencyOrder[b.urgency_level || 'low']
    return bScore - aScore
  })
}

export async function matchDoctors(patientId: string, symptoms: string): Promise<Doctor[]> {
  // Mock doctor matching based on symptoms
  const doctors = await fetchDoctors()
  return doctors.filter(doctor => doctor.availability)
}

export async function predictMortality(patientData: any): Promise<number> {
  // Mock mortality prediction
  const riskFactors = [
    patientData.age > 65 ? 0.2 : 0,
    patientData.urgency_level === 'critical' ? 0.3 : 0,
    patientData.medical_history?.includes('diabetes') ? 0.1 : 0,
    patientData.medical_history?.includes('heart') ? 0.15 : 0
  ]
  
  return Math.min(riskFactors.reduce((sum, factor) => sum + factor, 0), 0.8)
}