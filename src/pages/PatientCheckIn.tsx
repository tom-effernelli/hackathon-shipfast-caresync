import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QrCode, User, Heart, Phone, UserCheck, CheckCircle } from "lucide-react";
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
}

const PatientCheckIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  });

  const generatePatientId = () => {
    return `PT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateQRCode = async (patientData: PatientForm): Promise<string> => {
    const patientId = generatePatientId();
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
      // Generate QR code
      const qrCode = await generateQRCode(data);
      const patientId = generatePatientId();
      
      // Simulate storing patient data (replace with actual Supabase call)
      console.log('Patient data to store:', data);
      
      setCheckInResult({
        patientId,
        qrCode,
        checkInTime: new Date().toLocaleString(),
      });
      
      toast.success("Check-in successful! Please save your QR code.");
    } catch (error) {
      toast.error("Check-in failed. Please try again.");
      console.error('Check-in error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="text-muted-foreground">
            Please fill out the form below to complete your check-in process
          </p>
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
      </div>
    </div>
  );
};

export default PatientCheckIn;