// Claude AI integration for medical triage analysis
const CLAUDE_API_KEY = 'demo-key'; // Replace with actual key for production

export interface ImageAnalysisResult {
  urgency_level: 'critical' | 'high' | 'moderate' | 'low';
  confidence: number;
  observations: string[];
  recommendations: string[];
  estimated_severity: number; // 1-10 scale
}

export interface TriageAnalysisResult {
  urgency_level: 'critical' | 'high' | 'moderate' | 'low';
  estimated_wait_time: number; // minutes
  estimated_treatment_duration: number; // minutes
  reasoning: string;
  red_flags: string[];
  recommendations: string[];
  confidence_score: number; // 0-1
}

// Analyze injury/burn photos using Claude Vision (mock implementation)
export async function analyzePatientImage(imageFile: File): Promise<ImageAnalysisResult> {
  // Mock implementation for demo - replace with actual Claude Vision API call
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  const mockAnalyses = [
    {
      urgency_level: 'high' as const,
      confidence: 0.85,
      observations: [
        'Deep laceration visible on forearm',
        'Active bleeding present',
        'Wound appears to require suturing'
      ],
      recommendations: [
        'Immediate bleeding control',
        'Tetanus status verification',
        'Surgical consultation may be needed'
      ],
      estimated_severity: 7
    },
    {
      urgency_level: 'moderate' as const,
      confidence: 0.72,
      observations: [
        'Second-degree burn covering approximately 5% body surface',
        'Blistering present',
        'No signs of infection'
      ],
      recommendations: [
        'Cool water irrigation',
        'Pain management',
        'Burn care protocols'
      ],
      estimated_severity: 5
    },
    {
      urgency_level: 'low' as const,
      confidence: 0.90,
      observations: [
        'Minor abrasion',
        'No active bleeding',
        'Wound appears superficial'
      ],
      recommendations: [
        'Basic wound cleaning',
        'Antibiotic ointment',
        'Bandage application'
      ],
      estimated_severity: 2
    }
  ];
  
  return mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
}

// Comprehensive triage analysis combining clinical data and image analysis
export async function performTriageAnalysis(
  patientData: any,
  clinicalAssessment: any,
  imageAnalysis?: ImageAnalysisResult
): Promise<TriageAnalysisResult> {
  // Mock implementation for demo - replace with actual Claude API call
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
  
  // Calculate urgency based on multiple factors
  let urgencyScore = 0;
  const redFlags: string[] = [];
  const recommendations: string[] = [];
  
  // Age factor
  if (patientData.age > 65) urgencyScore += 1;
  if (patientData.age < 5) urgencyScore += 2;
  
  // Vital signs analysis
  if (clinicalAssessment.systolic_bp > 180 || clinicalAssessment.systolic_bp < 90) {
    urgencyScore += 3;
    redFlags.push('Critical blood pressure readings');
  }
  
  if (clinicalAssessment.heart_rate > 120 || clinicalAssessment.heart_rate < 50) {
    urgencyScore += 2;
    redFlags.push('Abnormal heart rate');
  }
  
  if (clinicalAssessment.oxygen_saturation < 95) {
    urgencyScore += 3;
    redFlags.push('Low oxygen saturation');
  }
  
  if (clinicalAssessment.temperature > 39 || clinicalAssessment.temperature < 35) {
    urgencyScore += 2;
    redFlags.push('Extreme body temperature');
  }
  
  // Pain scale factor
  if (clinicalAssessment.pain_scale >= 8) urgencyScore += 2;
  else if (clinicalAssessment.pain_scale >= 6) urgencyScore += 1;
  
  // Image analysis factor
  if (imageAnalysis) {
    urgencyScore += imageAnalysis.estimated_severity / 2;
    recommendations.push(...imageAnalysis.recommendations);
  }
  
  // Chief complaint analysis (mock NLP)
  const complaint = clinicalAssessment.chief_complaint?.toLowerCase() || '';
  if (complaint.includes('chest pain') || complaint.includes('heart')) {
    urgencyScore += 3;
    redFlags.push('Potential cardiac event');
  }
  if (complaint.includes('breathing') || complaint.includes('breath')) {
    urgencyScore += 2;
    redFlags.push('Respiratory distress');
  }
  if (complaint.includes('head') || complaint.includes('concussion')) {
    urgencyScore += 2;
    redFlags.push('Potential head injury');
  }
  
  // Determine urgency level
  let urgency_level: 'critical' | 'high' | 'moderate' | 'low';
  let estimated_wait_time: number;
  let estimated_treatment_duration: number;
  
  if (urgencyScore >= 8) {
    urgency_level = 'critical';
    estimated_wait_time = 0;
    estimated_treatment_duration = 120;
  } else if (urgencyScore >= 5) {
    urgency_level = 'high';
    estimated_wait_time = 15;
    estimated_treatment_duration = 90;
  } else if (urgencyScore >= 3) {
    urgency_level = 'moderate';
    estimated_wait_time = 45;
    estimated_treatment_duration = 60;
  } else {
    urgency_level = 'low';
    estimated_wait_time = 120;
    estimated_treatment_duration = 30;
  }
  
  // Generate reasoning
  const reasoning = `Based on comprehensive analysis: Patient age ${patientData.age}, vital signs (BP: ${clinicalAssessment.systolic_bp}/${clinicalAssessment.diastolic_bp}, HR: ${clinicalAssessment.heart_rate}, O2: ${clinicalAssessment.oxygen_saturation}%, Temp: ${clinicalAssessment.temperature}°C), pain scale ${clinicalAssessment.pain_scale}/10${imageAnalysis ? ', and image analysis showing ' + imageAnalysis.observations.join(', ') : ''}. Urgency score: ${urgencyScore}/10.`;
  
  // Add standard recommendations
  recommendations.push(
    'Monitor vital signs every 15 minutes',
    'Ensure IV access if not already established',
    'Pain management as appropriate'
  );
  
  if (urgency_level === 'critical') {
    recommendations.unshift('IMMEDIATE physician evaluation required');
  }
  
  return {
    urgency_level,
    estimated_wait_time,
    estimated_treatment_duration,
    reasoning,
    red_flags: redFlags,
    recommendations,
    confidence_score: Math.min(0.95, 0.6 + (urgencyScore / 20))
  };
}

// Generate mock historical data for statistics
export function generateMockStatisticsData() {
  const emergencyTypes = ['Cardiac', 'Trauma', 'Pediatric', 'Respiratory', 'Neurological', 'Other'];
  const months = ['July 2024', 'August 2024', 'September 2024', 'October 2024', 'November 2024', 'December 2024', 'January 2025'];
  
  return months.map(month => {
    const monthData: any = { month };
    emergencyTypes.forEach(type => {
      // Seasonal patterns
      let baseValue = Math.floor(Math.random() * 50) + 20;
      
      // Winter has more cardiac and respiratory
      if (month.includes('December') || month.includes('January')) {
        if (type === 'Cardiac') baseValue += 15;
        if (type === 'Respiratory') baseValue += 20;
      }
      
      // Summer has more trauma
      if (month.includes('July') || month.includes('August')) {
        if (type === 'Trauma') baseValue += 25;
      }
      
      monthData[type] = baseValue;
    });
    
    return monthData;
  });
}