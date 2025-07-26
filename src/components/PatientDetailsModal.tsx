import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Phone, Stethoscope, Clock, Activity, Heart, Thermometer, Eye, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: string;
  phone_number?: string;
  medical_history?: string;
  current_symptoms?: string;
  urgency_level?: string;
  workflow_status: string;
  assigned_doctor?: string;
  estimated_wait_time?: number;
  estimated_treatment_duration?: number;
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
  heart_rate_bpm?: number;
  blood_pressure?: string;
  temperature_fahrenheit?: number;
  respiratory_rate?: number;
  o2_saturation_percent?: number;
  pain_scale?: number;
}

interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: () => void;
}

export const PatientDetailsModal = ({ patient, isOpen, onClose, onPatientUpdated }: PatientDetailsModalProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Patient>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (patient) {
      setEditData(patient);
      setIsEditMode(false);
    }
  }, [patient]);

  if (!patient) return null;

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setEditData(patient);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!editData) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: editData.name,
          age: editData.age,
          gender: editData.gender,
          phone_number: editData.phone_number,
          medical_history: editData.medical_history,
          current_symptoms: editData.current_symptoms,
          urgency_level: editData.urgency_level,
          assigned_doctor: editData.assigned_doctor,
          estimated_wait_time: editData.estimated_wait_time,
          estimated_treatment_duration: editData.estimated_treatment_duration,
          clinical_notes: editData.clinical_notes,
          heart_rate_bpm: editData.heart_rate_bpm,
          blood_pressure: editData.blood_pressure,
          temperature_fahrenheit: editData.temperature_fahrenheit,
          respiratory_rate: editData.respiratory_rate,
          o2_saturation_percent: editData.o2_saturation_percent,
          pain_scale: editData.pain_scale,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (error) throw error;

      toast.success('Patient information updated successfully');
      setIsEditMode(false);
      onPatientUpdated();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient information');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'self_checkin': return 'bg-blue-500 text-white';
      case 'clinical_assessment': return 'bg-orange-500 text-white';
      case 'in_treatment': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyBadgeClass = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Details: {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge className={`${getStatusBadgeClass(patient.workflow_status)}`}>
                    {patient.workflow_status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {patient.urgency_level && (
                    <Badge className={`${getUrgencyBadgeClass(patient.urgency_level)}`}>
                      {patient.urgency_level.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Registered on: {formatDate(patient.created_at)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last updated: {formatDate(patient.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={editData.age || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={editData.gender || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, gender: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone_number || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><strong>Age:</strong> {patient.age} years</p>
                    <p><strong>Gender:</strong> {patient.gender || 'Not specified'}</p>
                    {patient.phone_number && (
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone_number}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="medical_history">Medical History</Label>
                    <Textarea
                      id="medical_history"
                      value={editData.medical_history || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, medical_history: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_symptoms">Current Symptoms</Label>
                    <Textarea
                      id="current_symptoms"
                      value={editData.current_symptoms || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, current_symptoms: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinical_notes">Clinical Notes</Label>
                    <Textarea
                      id="clinical_notes"
                      value={editData.clinical_notes || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, clinical_notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="urgency">Urgency Level</Label>
                      <Select value={editData.urgency_level || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, urgency_level: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assigned_doctor">Assigned Doctor</Label>
                      <Input
                        id="assigned_doctor"
                        value={editData.assigned_doctor || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, assigned_doctor: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {patient.medical_history && (
                    <div>
                      <Label className="text-sm font-medium">Medical History</Label>
                      <p className="text-sm text-muted-foreground mt-1">{patient.medical_history}</p>
                    </div>
                  )}
                  {patient.current_symptoms && (
                    <div>
                      <Label className="text-sm font-medium">Current Symptoms</Label>
                      <p className="text-sm text-muted-foreground mt-1">{patient.current_symptoms}</p>
                    </div>
                  )}
                  {patient.clinical_notes && (
                    <div>
                      <Label className="text-sm font-medium">Clinical Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">{patient.clinical_notes}</p>
                    </div>
                  )}
                  {patient.assigned_doctor && (
                    <div>
                      <Label className="text-sm font-medium">Assigned Doctor</Label>
                      <p className="text-sm text-muted-foreground mt-1">Dr. {patient.assigned_doctor}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                    <Input
                      id="heart_rate"
                      type="number"
                      value={editData.heart_rate_bpm || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, heart_rate_bpm: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="blood_pressure">Blood Pressure</Label>
                    <Input
                      id="blood_pressure"
                      value={editData.blood_pressure || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, blood_pressure: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperature (°F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={editData.temperature_fahrenheit || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, temperature_fahrenheit: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
                    <Input
                      id="respiratory_rate"
                      type="number"
                      value={editData.respiratory_rate || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, respiratory_rate: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="o2_saturation">O2 Saturation (%)</Label>
                    <Input
                      id="o2_saturation"
                      type="number"
                      value={editData.o2_saturation_percent || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, o2_saturation_percent: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pain_scale">Pain Scale (1-10)</Label>
                    <Input
                      id="pain_scale"
                      type="number"
                      min="1"
                      max="10"
                      value={editData.pain_scale || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, pain_scale: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {patient.heart_rate_bpm && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{patient.heart_rate_bpm} bpm</span>
                    </div>
                  )}
                  {patient.blood_pressure && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>{patient.blood_pressure}</span>
                    </div>
                  )}
                  {patient.temperature_fahrenheit && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <span>{patient.temperature_fahrenheit}°F</span>
                    </div>
                  )}
                  {patient.respiratory_rate && (
                    <div>
                      <span className="font-medium">Respiration:</span> {patient.respiratory_rate}/min
                    </div>
                  )}
                  {patient.o2_saturation_percent && (
                    <div>
                      <span className="font-medium">O2:</span> {patient.o2_saturation_percent}%
                    </div>
                  )}
                  {patient.pain_scale && (
                    <div>
                      <span className="font-medium">Pain:</span> {patient.pain_scale}/10
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated_wait_time">Estimated Wait Time (min)</Label>
                    <Input
                      id="estimated_wait_time"
                      type="number"
                      value={editData.estimated_wait_time || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, estimated_wait_time: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_treatment_duration">Estimated Treatment Duration (min)</Label>
                    <Input
                      id="estimated_treatment_duration"
                      type="number"
                      value={editData.estimated_treatment_duration || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, estimated_treatment_duration: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Estimated wait time:</span> {patient.estimated_wait_time ? `${patient.estimated_wait_time} min` : 'Not defined'}
                  </div>
                  <div>
                    <span className="font-medium">Estimated treatment duration:</span> {patient.estimated_treatment_duration ? `${patient.estimated_treatment_duration} min` : 'Not defined'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  <Save className="w-4 h-4 mr-1" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  <Eye className="w-4 h-4 mr-1" />
                  Close
                </Button>
                <Button onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};