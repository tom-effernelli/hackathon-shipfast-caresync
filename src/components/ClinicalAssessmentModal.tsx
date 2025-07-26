import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updatePatientStatus } from "@/lib/supabase-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, Heart, CheckCircle, Activity, Brain, AlertTriangle, Clock, Target, CheckSquare, AlertCircle, ChevronDown, Stethoscope } from "lucide-react";
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

interface ClinicalAssessmentModalProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: () => void;
}

export const ClinicalAssessmentModal = ({
  patient,
  isOpen,
  onClose,
  onPatientUpdated
}: ClinicalAssessmentModalProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClinicalAssessment>({
    resolver: zodResolver(clinicalAssessmentSchema),
  });

  const onSubmit = async (data: ClinicalAssessment) => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = {
        urgencyLevel: "HIGH",
        estimatedWaitTime: 15,
        treatmentDuration: 180 // 3 hours in minutes
      };

      // Update patient status in Supabase
      await updatePatientStatus(patient.id, 'clinical_assessment', {
        urgency_level: result.urgencyLevel.toLowerCase() as any,
        estimated_wait_time: result.estimatedWaitTime,
        estimated_treatment_duration: result.treatmentDuration
      });

      toast.success("Clinical assessment completed successfully!");
      reset();
      onPatientUpdated();
      onClose();
    } catch (error) {
      toast.error("Assessment failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!patient) return null;

  // Parse AI analysis result
  const aiAnalysis = patient.aura_analysis_result ? 
    (typeof patient.aura_analysis_result === 'string' ? 
      JSON.parse(patient.aura_analysis_result) : 
      patient.aura_analysis_result) : null;

  const getTriScoreColor = (triScore: string) => {
    if (triScore?.toLowerCase().includes('tri i')) return 'bg-red-100 text-red-800 border-red-200';
    if (triScore?.toLowerCase().includes('tri ii')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (triScore?.toLowerCase().includes('tri iii')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Clinical Assessment - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information (Read-only) */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
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
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                  <p className="font-medium">{patient.age}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Medical History</Label>
                  <p className="font-medium">{patient.medical_history || 'None reported'}</p>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-muted-foreground">Check-in Time</Label>
                <p className="text-sm">{new Date(patient.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Section */}
          {aiAnalysis && (
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Brain className="w-5 h-5" />
                  Preliminary AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Triage Score */}
                <div className="flex justify-center">
                  <Badge className={`text-sm px-4 py-1 font-medium ${getTriScoreColor(aiAnalysis.tri_score)}`}>
                    Triage Score: {aiAnalysis.tri_score}
                  </Badge>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Reason */}
                  {aiAnalysis.main_reason && (
                    <div className="border rounded-lg p-3">
                      <Label className="text-sm font-medium text-muted-foreground">Primary Reason</Label>
                      <p className="text-sm font-medium mt-1">{aiAnalysis.main_reason}</p>
                    </div>
                  )}

                  {/* Alarming Signs */}
                  {aiAnalysis.alarming_signs && aiAnalysis.alarming_signs.length > 0 && (
                    <div className="border rounded-lg p-3">
                      <Label className="text-sm font-medium text-muted-foreground">Alarming Signs</Label>
                      <div className="mt-1 space-y-1">
                        {aiAnalysis.alarming_signs.map((sign: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{sign}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wait Time */}
                  {aiAnalysis.estimated_wait_time_minutes && (
                    <div className="border rounded-lg p-3 text-center">
                      <Label className="text-sm font-medium text-muted-foreground block">Estimated Wait Time</Label>
                      <p className="text-lg font-semibold mt-1">{aiAnalysis.estimated_wait_time_minutes} min</p>
                    </div>
                  )}

                  {/* Treatment Duration */}
                  {aiAnalysis.estimated_treatment_duration_minutes && (
                    <div className="border rounded-lg p-3 text-center">
                      <Label className="text-sm font-medium text-muted-foreground block">Treatment Duration</Label>
                      <p className="text-lg font-semibold mt-1">{aiAnalysis.estimated_treatment_duration_minutes} min</p>
                    </div>
                  )}
                </div>

                {/* Anthropic Attribution */}
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Generated by Anthropic Claude with text and image analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No AI Analysis Message */}
          {!aiAnalysis && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No preliminary AI analysis available for this patient.</p>
              </CardContent>
            </Card>
          )}

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

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAnalyzing}
                className="min-w-[200px]"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Complete Assessment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};