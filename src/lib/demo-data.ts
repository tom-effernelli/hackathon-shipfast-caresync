// Demo data with realistic medical scenarios for impressive pitch demos
export const demoPatients = [
  {
    name: "Maria Rodriguez",
    age: 34,
    gender: "female",
    phone_number: "+1 (555) 123-4567",
    medical_history: "Acute chest pain with radiating left arm pain, history of hypertension. Arrived by ambulance.",
    workflow_status: "clinical_assessment",
    urgency_level: "critical",
    estimated_wait_time: 5,
    estimated_treatment_duration: 45,
    assigned_doctor: "Dr. Sarah Chen (Emergency Medicine)",
    chiefComplaint: "Chest pain, shortness of breath",
    checkInTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
  },
  {
    name: "James Thompson",
    age: 67,
    gender: "male", 
    phone_number: "+1 (555) 987-6543",
    medical_history: "Diabetic patient with severe abdominal pain, nausea, and vomiting. Possible diabetic ketoacidosis.",
    workflow_status: "in_treatment",
    urgency_level: "high",
    estimated_wait_time: 0,
    estimated_treatment_duration: 60,
    assigned_doctor: "Dr. Michael Roberts (Internal Medicine)",
    chiefComplaint: "Severe abdominal pain, diabetic emergency",
    treatmentStartTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // Started 25 mins ago
  },
  {
    name: "Emma Wilson",
    age: 8,
    gender: "female",
    phone_number: "+1 (555) 456-7890",
    medical_history: "High fever (103°F), difficulty breathing, possible pneumonia. Accompanied by parents.",
    workflow_status: "clinical_assessment",
    urgency_level: "high",
    estimated_wait_time: 10,
    estimated_treatment_duration: 30,
    assigned_doctor: "Dr. Lisa Park (Pediatrics)",
    chiefComplaint: "High fever, breathing difficulties",
    checkInTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
  },
  {
    name: "Robert Kim",
    age: 45,
    gender: "male",
    phone_number: "+1 (555) 234-5678",
    medical_history: "Motorcycle accident with suspected broken ribs and possible internal bleeding. Conscious but in pain.",
    workflow_status: "in_treatment",
    urgency_level: "high",
    estimated_wait_time: 0,
    estimated_treatment_duration: 90,
    assigned_doctor: "Dr. David Miller (Trauma Surgery)",
    chiefComplaint: "Motor vehicle accident, chest trauma",
    treatmentStartTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // Started 35 mins ago
  },
  {
    name: "Sophie Dubois",
    age: 28,
    gender: "female",
    phone_number: "+1 (555) 345-6789",
    medical_history: "Severe allergic reaction to shellfish, facial swelling, difficulty swallowing. EpiPen administered.",
    workflow_status: "clinical_assessment",
    urgency_level: "critical",
    estimated_wait_time: 2,
    estimated_treatment_duration: 20,
    assigned_doctor: "Dr. Jennifer Wu (Emergency Medicine)",
    chiefComplaint: "Anaphylactic reaction, airway compromise",
    checkInTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
  },
  {
    name: "Michael Chang",
    age: 52,
    gender: "male",
    phone_number: "+1 (555) 567-8901",
    medical_history: "Workplace injury - deep laceration on left hand from machinery. Bleeding controlled, needs sutures.",
    workflow_status: "self_checkin",
    urgency_level: "moderate",
    estimated_wait_time: 25,
    estimated_treatment_duration: 45,
    chiefComplaint: "Deep hand laceration, workplace injury",
    checkInTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
  },
  {
    name: "Isabella Santos",
    age: 19,
    gender: "female",
    phone_number: "+1 (555) 678-9012",
    medical_history: "Ankle sprain from basketball game, moderate swelling and pain. Walking with difficulty.",
    workflow_status: "self_checkin",
    urgency_level: "low",
    estimated_wait_time: 45,
    estimated_treatment_duration: 25,
    chiefComplaint: "Sports injury - ankle sprain",
    checkInTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
  },
  {
    name: "Ahmed Hassan",
    age: 35,
    gender: "male",
    phone_number: "+1 (555) 789-0123",
    medical_history: "Severe migraine with visual disturbances, nausea. History of cluster headaches.",
    workflow_status: "self_checkin",
    urgency_level: "moderate",
    estimated_wait_time: 30,
    estimated_treatment_duration: 20,
    chiefComplaint: "Severe migraine with aura",
    checkInTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago
  },
  {
    name: "Grace Johnson",
    age: 72,
    gender: "female",
    phone_number: "+1 (555) 890-1234",
    medical_history: "Fall at home, hit head, confusion and dizziness. Possible concussion, lives alone.",
    workflow_status: "in_treatment",
    urgency_level: "moderate",
    estimated_wait_time: 0,
    estimated_treatment_duration: 40,
    assigned_doctor: "Dr. Kevin Torres (Neurology)",
    chiefComplaint: "Head injury from fall, altered mental status",
    treatmentStartTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Started 15 mins ago
  },
  {
    name: "Lucas Anderson",
    age: 26,
    gender: "male",
    phone_number: "+1 (555) 901-2345",
    medical_history: "Food poisoning symptoms - severe vomiting, diarrhea, dehydration. Attended wedding yesterday.",
    workflow_status: "self_checkin",
    urgency_level: "low",
    estimated_wait_time: 35,
    estimated_treatment_duration: 30,
    chiefComplaint: "Gastroenteritis, dehydration",
    checkInTime: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 mins ago
  }
];

export const demoStatistics = {
  totalPatients: 24,
  averageWaitTime: 28,
  criticalCases: 3,
  completedToday: 15,
  currentCapacity: 85,
  hourlyAdmissions: [2, 1, 0, 1, 3, 4, 6, 8, 5, 7, 9, 12],
  urgencyDistribution: {
    critical: 12,
    high: 25,
    moderate: 45,
    low: 18
  },
  departmentEfficiency: 94,
  patientSatisfaction: 4.7
};

// Generate realistic avatars using initials with medical theme colors
export const getPatientAvatar = (name: string, urgency?: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white', 
    moderate: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white',
    default: 'bg-blue-500 text-white'
  };
  
  return {
    initials,
    className: colors[urgency as keyof typeof colors] || colors.default
  };
};