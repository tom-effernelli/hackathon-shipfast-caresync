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
import { User, Heart, CheckCircle, Activity } from "lucide-react";
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