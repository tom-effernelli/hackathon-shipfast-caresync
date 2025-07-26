import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { VoiceCheckIn } from "@/components/VoiceCheckIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, User, Heart, Phone, UserCheck, CheckCircle, Mic } from "lucide-react";
import { toast } from "sonner";

const patientSchema = z.object({
  // Basic Information
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(1).max(120),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  emergencyContactName: z.string().min(2, "Emergency contact name required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone required"),
  emergencyContactRelation: z.string().min(2, "Relationship required"),
  
  // Medical History
  currentMedications: z.string(),
  allergies: z.string(),
  chronicConditions: z.string(),
  pastSurgeries: z.string(),
  chiefComplaint: z.string().min(10, "Please describe your main concern"),
});

type PatientForm = z.infer<typeof patientSchema>;

interface CheckInResult {
  patientId: string;
  qrCode: string;
  checkInTime: string;
  analysis?: any;
}

const PatientCheckIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [showVoiceCheckIn, setShowVoiceCheckIn] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  });

  const generatePatientId = () => {
    return `PT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateQRCode = async (patientData: PatientForm, patientId: string): Promise<string> => {
    const qrData = {
      patientId,
      name: patientData.fullName,
      age: patientData.age,
      gender: patientData.gender,
      checkInTime: new Date().toISOString(),
      chiefComplaint: patientData.chiefComplaint,
    };
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e40af', // primary blue
          light: '#ffffff',
        },
      });
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  };

  const onSubmit = async (data: PatientForm) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create the Patient Record in Supabase
      const patientDataToInsert = {
        name: data.fullName,
        age: parseInt(data.age.toString(), 10),
        gender: data.gender,
        phone_number: data.phone,
        injury_image_base64: imageBase64,
        patient_submission_data: {
          emergency_contact: {
            name: data.emergencyContactName,
            phone: data.emergencyContactPhone,
            relationship: data.emergencyContactRelation,
          },
          medical_history: {
            medications: data.currentMedications,
            allergies: data.allergies,
            chronic_conditions: data.chronicConditions,
            past_surgeries: data.pastSurgeries,
          },
          chief_complaint: data.chiefComplaint,
        }
      };

      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert(patientDataToInsert)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const patientId = newPatient.id;

      // Step 2: Invoke the smart-handler Edge Function
      const functionPayload = {
        patientId: patientId,
        ...data,
        injury_image_base64: imageBase64
      };

      const { data: analysisResult, error: functionError } = await supabase.functions.invoke(
        'smart-handler',
        { body: functionPayload }
      );

      if (functionError) {
        console.error('Analysis function error:', functionError);
        // Continue with check-in even if analysis fails
      }

      // Generate QR code
      const qrCode = await generateQRCode(data, patientId);
      
      // Step 3: Update the State and Display the Results
      setCheckInResult({
        patientId,
        qrCode,
        checkInTime: new Date().toLocaleString(),
        analysis: analysisResult
      });
      
      toast.success("Check-in successful! Analysis complete.");
    } catch (error) {
      toast.error("Check-in failed. Please try again.");
      console.error('Check-in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (imageBase64String: string | null) => {
    setImageBase64(imageBase64String);
  };

  const handleVoiceCheckInComplete = (voiceData: PatientForm) => {
    // Pre-fill the form with voice data
    Object.entries(voiceData).forEach(([key, value]) => {
      setValue(key as keyof PatientForm, value);
    });
    
    setShowVoiceCheckIn(false);
    toast.success("Voice check-in completed! Please review and submit the form.");
  };

  if (checkInResult) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-success bg-success/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-success-foreground" />
              </div>
              <CardTitle className="text-2xl text-success">Check-In Complete!</CardTitle>
              <p className="text-muted-foreground">
                Patient ID: <span className="font-mono font-bold">{checkInResult.patientId}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Checked in at: {checkInResult.checkInTime}
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {checkInResult.analysis && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-900 mb-4">Preliminary AI Triage Results</h3>
                  <div className="space-y-3 text-left">
                    <div>
                      <span className="font-medium text-green-800">Triage Score: </span>
                      <span className="text-green-700">{checkInResult.analysis.tri_score || 'Not determined'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Main Reason: </span>
                      <span className="text-green-700">{checkInResult.analysis.main_reason || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Estimated Wait Time: </span>
                      <span className="text-green-700">
                        {checkInResult.analysis.estimated_wait_time_minutes ? 
                          `${checkInResult.analysis.estimated_wait_time_minutes} minutes` : 
                          'To be determined'
                        }
                      </span>
                    </div>
                    {checkInResult.analysis.recommendations && (
                      <div>
                        <span className="font-medium text-green-800">Recommendations: </span>
                        <span className="text-green-700">{checkInResult.analysis.recommendations}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Your QR Code</h3>
                <div className="flex justify-center">
                  <img 
                    src={checkInResult.qrCode} 
                    alt="Patient QR Code" 
                    className="border rounded-lg shadow-sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Please show this QR code to the triage nurse when called.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `patient-qr-${checkInResult.patientId}.png`;
                    link.href = checkInResult.qrCode;
                    link.click();
                  }}
                  className="w-full"
                  size="lg"
                >
                  Download QR Code
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setCheckInResult(null)}
                  className="w-full"
                  size="lg"
                >
                  Check In Another Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <UserCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Patient Self Check-In</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Choose your preferred check-in method
          </p>
          
          {/* Check-in Method Selection */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={() => setShowVoiceCheckIn(true)}
              size="lg"
              variant="outline"
              className="min-w-[200px] h-16 text-lg"
            >
              <Mic className="w-6 h-6 mr-3" />
              Voice Check-In
            </Button>
            <div className="text-sm text-muted-foreground self-center">or</div>
            <Button
              onClick={() => document.getElementById('manual-form')?.scrollIntoView({ behavior: 'smooth' })}
              size="lg"
              variant="default"
              className="min-w-[200px] h-16 text-lg"
            >
              <User className="w-6 h-6 mr-3" />
              Manual Form
            </Button>
          </div>
        </div>

        <div id="manual-form">
          <h2 className="text-2xl font-semibold text-center mb-6">Manual Check-In Form</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Enter your full name"
                    className="text-lg h-12"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    {...register("age", { valueAsNumber: true })}
                    placeholder="Enter your age"
                    className="text-lg h-12"
                  />
                  {errors.age && (
                    <p className="text-sm text-destructive">{errors.age.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue("gender", value as "Male" | "Female" | "Other")}>
                    <SelectTrigger className="text-lg h-12">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="Enter your phone number"
                    className="text-lg h-12"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    {...register("emergencyContactName")}
                    placeholder="Full name"
                    className="text-lg h-12"
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    {...register("emergencyContactPhone")}
                    placeholder="Phone number"
                    className="text-lg h-12"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">Relationship *</Label>
                  <Input
                    id="emergencyContactRelation"
                    {...register("emergencyContactRelation")}
                    placeholder="e.g., Spouse, Parent"
                    className="text-lg h-12"
                  />
                  {errors.emergencyContactRelation && (
                    <p className="text-sm text-destructive">{errors.emergencyContactRelation.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    {...register("currentMedications")}
                    placeholder="List all current medications and dosages"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Textarea
                    id="allergies"
                    {...register("allergies")}
                    placeholder="List any known allergies (medications, food, environmental)"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                  <Textarea
                    id="chronicConditions"
                    {...register("chronicConditions")}
                    placeholder="List any ongoing medical conditions"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pastSurgeries">Past Surgeries</Label>
                  <Textarea
                    id="pastSurgeries"
                    {...register("pastSurgeries")}
                    placeholder="List any previous surgeries and dates"
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Visit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">What brings you in today? *</Label>
                <Textarea
                  id="chiefComplaint"
                  {...register("chiefComplaint")}
                  placeholder="Please describe your main concern or reason for today's visit"
                  className="min-h-[120px] resize-none"
                />
                {errors.chiefComplaint && (
                  <p className="text-sm text-destructive">{errors.chiefComplaint.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload Section */}
          <ImageUpload 
            onImageSelect={handleImageSelect}
            disabled={isSubmitting}
          />

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full md:w-auto min-w-[200px] h-14 text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Complete Check-In
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Voice Check-In Modal */}
        <VoiceCheckIn
          isOpen={showVoiceCheckIn}
          onClose={() => setShowVoiceCheckIn(false)}
          onComplete={handleVoiceCheckInComplete}
        />
      </div>
    </div>
  );
};

export default PatientCheckIn;