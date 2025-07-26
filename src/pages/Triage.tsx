import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchPatients, updatePatientStatus } from "@/lib/supabase-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Activity, User, Heart, Phone, FileText, Camera, CheckCircle, Clock, QrCode } from "lucide-react";
import { toast } from "sonner";

const clinicalAssessmentSchema = z.object({
  currentSymptoms: z.string().min(10, "Please describe current symptoms"),
  painScale: z.number().min(0).max(10),
  temperature: z.number().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  clinicalNotes: z.string().optional(),
});

type ClinicalAssessment = z.infer<typeof clinicalAssessmentSchema>;

const Triage = () => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInPatients, setCheckInPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ClinicalAssessment>({
    resolver: zodResolver(clinicalAssessmentSchema),
  });

  useEffect(() => {
    loadCheckInPatients();
  }, []);

  useEffect(() => {
    const filtered = checkInPatients.filter(patient => 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, checkInPatients]);

  const loadCheckInPatients = async () => {
    try {
      const patients = await fetchPatients();
      const selfCheckInPatients = patients.filter(p => p.workflow_status === 'self_checkin');
      setCheckInPatients(selfCheckInPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patient data');
    }
  };

  const onSubmit = async (data: ClinicalAssessment) => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting triage analysis with data:', {
        patientInfo: selectedPatient,
        clinicalAssessment: data,
      });

      // Use the actual performTriageAnalysis function from api.ts
      const { performTriageAnalysis } = await import("@/lib/api");
      
      const result = await performTriageAnalysis(selectedPatient, data);
      
      console.log('Triage analysis result:', result);
      
      // Transform result to match expected format
      const transformedResult = {
        urgencyLevel: result.urgency_level.toUpperCase(),
        triageCategory: `ESI Level ${result.urgency_level === 'critical' ? '1' : result.urgency_level === 'high' ? '2' : result.urgency_level === 'moderate' ? '3' : '4'}`,
        estimatedWaitTime: `${result.estimated_wait_time} minutes`,
        treatmentDuration: `${Math.floor(result.estimated_treatment_duration / 60)} hours`,
        redFlags: result.red_flags,
        recommendations: result.recommendations,
        confidence: Math.round(result.confidence_score * 100),
        reasoning: result.reasoning
      };
      
      setAnalysisResult(transformedResult);

      // Update patient status in Supabase
      if (selectedPatient) {
        await updatePatientStatus(selectedPatient.id, 'clinical_assessment', {
          urgency_level: result.urgency_level.toLowerCase() as any,
          estimated_wait_time: result.estimated_wait_time,
          estimated_treatment_duration: result.estimated_treatment_duration
        });
        
        // Refresh patient list
        await loadCheckInPatients();
      }

      toast.success("Triage analysis complete and saved!");
    } catch (error) {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setShowQrScanner(false);
    reset();
    setAnalysisResult(null);
  };

  const handleQrScan = (patientId: string) => {
    const patient = checkInPatients.find(p => p.id === patientId);
    if (patient) {
      handlePatientSelect(patient);
      toast.success(`Patient ${patient.name} loaded from QR code`);
    } else {
      toast.error("Patient not found or not checked in");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Nurse/Doctor Triage Interface</h1>
          </div>
          <p className="text-muted-foreground">
            Clinical assessment and AI-powered triage analysis
          </p>
        </div>

        {/* Patient Lookup Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Patient Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={showQrScanner ? "default" : "outline"}
                  onClick={() => setShowQrScanner(!showQrScanner)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showQrScanner ? "Hide QR Scanner" : "Scan QR Code"}
                </Button>
                
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-lg h-12"
                    disabled={showQrScanner}
                  />
                </div>
              </div>

              {showQrScanner && (
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center bg-primary/5">
                  <QrCode className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold mb-2">QR Code Scanner</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan the patient's QR code from their check-in receipt
                  </p>
                  <Input
                    placeholder="Enter patient ID from QR code..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        handleQrScan(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="max-w-md mx-auto"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    For demo: Press Enter after typing patient ID
                  </p>
                </div>
              )}
              
              {searchQuery && filteredPatients.length > 0 && (
                <div className="border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.id} • Age: {patient.age}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Checked In
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Self-Check-in Data (Read-only) */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Provided Information
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Self Check-in Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedPatient.name}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="font-medium">{selectedPatient.age}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Medical History</Label>
                    <p className="font-medium">{selectedPatient.medical_history || 'None reported'}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Patient Status</Label>
                  <p className="text-sm">Check-in completed at {new Date(selectedPatient.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Assessment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Clinical Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentSymptoms">Current Symptoms & Presentation *</Label>
                    <Textarea
                      id="currentSymptoms"
                      {...register("currentSymptoms")}
                      placeholder="Describe current symptoms, patient presentation, and clinical observations"
                      className="min-h-[100px] resize-none"
                    />
                    {errors.currentSymptoms && (
                      <p className="text-sm text-destructive">{errors.currentSymptoms.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="painScale">Pain Scale (0-10) *</Label>
                      <Input
                        id="painScale"
                        type="number"
                        min="0"
                        max="10"
                        {...register("painScale", { valueAsNumber: true })}
                        className="text-lg h-12"
                      />
                      {errors.painScale && (
                        <p className="text-sm text-destructive">{errors.painScale.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°F)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        {...register("temperature", { valueAsNumber: true })}
                        placeholder="98.6"
                        className="text-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodPressure">Blood Pressure</Label>
                      <Input
                        id="bloodPressure"
                        {...register("bloodPressure")}
                        placeholder="120/80"
                        className="text-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                      <Input
                        id="heartRate"
                        type="number"
                        {...register("heartRate", { valueAsNumber: true })}
                        placeholder="72"
                        className="text-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                      <Input
                        id="respiratoryRate"
                        type="number"
                        {...register("respiratoryRate", { valueAsNumber: true })}
                        placeholder="16"
                        className="text-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oxygenSaturation">O2 Saturation (%)</Label>
                      <Input
                        id="oxygenSaturation"
                        type="number"
                        min="0"
                        max="100"
                        {...register("oxygenSaturation", { valueAsNumber: true })}
                        placeholder="98"
                        className="text-lg h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                    <Textarea
                      id="clinicalNotes"
                      {...register("clinicalNotes")}
                      placeholder="Additional clinical observations, examination findings, and notes"
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isAnalyzing}
                  className="w-full md:w-auto min-w-[300px] h-14 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Analyzing with Claude AI...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Generate Triage Analysis
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Analysis Results */}
            {analysisResult && (
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Activity className="w-5 h-5" />
                    AI Triage Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-background p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Urgency Level</Label>
                      <Badge variant={analysisResult.urgencyLevel === 'HIGH' ? 'destructive' : 'secondary'} className="mt-1">
                        {analysisResult.urgencyLevel}
                      </Badge>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Triage Category</Label>
                      <p className="font-bold text-lg">{analysisResult.triageCategory}</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Est. Wait Time</Label>
                      <p className="font-bold text-lg flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {analysisResult.estimatedWaitTime}
                      </p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-muted-foreground">Treatment Duration</Label>
                      <p className="font-bold text-lg">{analysisResult.treatmentDuration}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                      <Label className="text-sm font-medium text-destructive">Red Flags</Label>
                      <ul className="mt-2 space-y-1">
                        {analysisResult.redFlags.map((flag: string, index: number) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <Label className="text-sm font-medium text-primary">Recommendations</Label>
                      <ul className="mt-2 space-y-1">
                        {analysisResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-primary" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-center">
                    <Badge variant="outline">
                      Confidence Score: {analysisResult.confidence}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!selectedPatient && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Patient to Begin</h3>
              <p className="text-muted-foreground">
                Search for a patient who has completed self-check-in to start the triage assessment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Triage;