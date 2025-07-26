import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchPatients, updatePatientStatus, type Patient as SupabasePatient } from "@/lib/supabase-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Clock, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck,
  Stethoscope,
  Timer,
  Heart
} from "lucide-react";
import { toast } from "sonner";

interface Patient extends SupabasePatient {
  status?: 'checked-in' | 'assessed' | 'in-treatment';
  chiefComplaint?: string;
  checkInTime?: string;
  assessmentTime?: string;
  treatmentStartTime?: string;
  triageCategory?: string;
  assignedDoctor?: string;
  treatmentProgress?: number;
}

// Hook to calculate real-time treatment progress
const useRealTimeProgress = (patient: Patient) => {
  const [progress, setProgress] = useState<{percentage: number, timeElapsed: number}>({ percentage: 0, timeElapsed: 0 });

  useEffect(() => {
    if (patient.status !== 'in-treatment' || !patient.treatmentStartTime || !patient.estimated_treatment_duration) {
      return;
    }

    const updateProgress = () => {
      const startTime = new Date(patient.treatmentStartTime!).getTime();
      const currentTime = Date.now();
      const elapsedMs = currentTime - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      const totalDuration = patient.estimated_treatment_duration!;
      const percentage = Math.min(100, Math.round((elapsedMinutes / totalDuration) * 100));
      
      setProgress({ percentage, timeElapsed: elapsedMinutes });
    };

    // Update immediately
    updateProgress();
    
    // Update every 30 seconds for real-time progress
    const interval = setInterval(updateProgress, 30000);
    
    return () => clearInterval(interval);
  }, [patient.status, patient.treatmentStartTime, patient.estimated_treatment_duration]);

  return progress;
};


const PatientCard = ({ patient, isDragging }: { patient: Patient; isDragging?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: patient.id });

  const progressData = useRealTimeProgress(patient);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'moderate': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ${diffMinutes % 60}m ago`;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{patient.name}</CardTitle>
          </div>
          <div className="text-xs text-muted-foreground">
            Age {patient.age}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {patient.chiefComplaint || patient.medical_history || 'Medical consultation'}
        </p>

        {patient.status === 'checked-in' && (
          <>
            <Badge variant="outline" className="text-xs">
              <UserCheck className="w-3 h-3 mr-1" />
              Awaiting Clinical Assessment
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Check-in: {formatTime(patient.checkInTime)} ({getTimeSince(patient.checkInTime)})
            </div>
          </>
        )}

        {patient.status === 'assessed' && (
          <>
            <div className="space-y-2">
              <Badge variant={getUrgencyColor(patient.urgency_level || 'low')} className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {patient.triageCategory}
              </Badge>
              <div className="text-sm font-medium text-primary">
                Wait Time: {patient.estimated_wait_time ? `${patient.estimated_wait_time} min` : 'TBD'}
              </div>
              {patient.assignedDoctor && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Stethoscope className="w-3 h-3" />
                  {patient.assignedDoctor}
                </div>
              )}
            </div>
          </>
        )}

        {patient.status === 'in-treatment' && (
          <>
            <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
              <Activity className="w-3 h-3 mr-1" />
              In Treatment
            </Badge>
            <div className="space-y-3">
              <div className="text-sm font-medium text-success">
                Duration: {patient.estimated_treatment_duration ? `${patient.estimated_treatment_duration} min` : 'TBD'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Stethoscope className="w-3 h-3" />
                {patient.assigned_doctor || 'Dr. Smith'}
              </div>
              
              {/* Real-time Green Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Treatment Progress</span>
                  <span className="font-semibold text-success">
                    {progressData.timeElapsed}/{patient.estimated_treatment_duration || 60} min ({progressData.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-in-out"
                    style={{ width: `${progressData.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-success/80 font-medium">
                  Treatment: {progressData.timeElapsed}/{patient.estimated_treatment_duration || 60} min ({progressData.percentage}%)
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const Column = ({ 
  title, 
  patients, 
  status, 
  icon: Icon, 
  themeColor 
}: { 
  title: string; 
  patients: Patient[]; 
  status: string;
  icon: any;
  themeColor: string;
}) => {
  return (
    <div className="flex-1 min-w-0">
      <Card className={`h-full border-${themeColor}/20`}>
        <CardHeader className={`bg-${themeColor}/5 border-b border-${themeColor}/10`}>
          <CardTitle className={`flex items-center gap-2 text-${themeColor}`}>
            <Icon className="w-5 h-5" />
            {title}
            <Badge variant="secondary" className="ml-auto">
              {patients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
          <SortableContext items={patients.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
              {patients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No patients in this stage</p>
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
};

const TriageWorkflow = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const supabasePatients = await fetchPatients();
      
      // Transform Supabase patients to workflow format
      const workflowPatients: Patient[] = supabasePatients.map(p => ({
        ...p,
        status: p.workflow_status === 'self_checkin' ? 'checked-in' : 
               p.workflow_status === 'clinical_assessment' ? 'assessed' : 'in-treatment',
        chiefComplaint: p.medical_history || 'Medical consultation',
        checkInTime: p.created_at,
        treatmentStartTime: p.workflow_status === 'in_treatment' ? p.updated_at : undefined,
        estimatedWaitTime: p.estimated_wait_time ? `${p.estimated_wait_time} minutes` : undefined,
        estimatedTreatmentDuration: p.estimated_treatment_duration ? `${p.estimated_treatment_duration} minutes` : undefined,
        assignedDoctor: p.assigned_doctor,
        triageCategory: p.urgency_level ? `${p.urgency_level.charAt(0).toUpperCase() + p.urgency_level.slice(1)} Priority` : 'Standard'
      }));
      
      setPatients(workflowPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patient data');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.chiefComplaint || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInPatients = filteredPatients.filter(p => p.status === 'checked-in');
  const assessedPatients = filteredPatients.filter(p => p.status === 'assessed');
  const inTreatmentPatients = filteredPatients.filter(p => p.status === 'in-treatment');

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the patient being dragged
    const activePatient = patients.find(p => p.id === activeId);
    if (!activePatient) return;

    // Determine the new status based on which column was dropped into
    let newStatus: Patient['status'] = activePatient.status;
    
    // Check if dropped on a patient card (get that patient's status)
    const overPatient = patients.find(p => p.id === overId);
    if (overPatient) {
      newStatus = overPatient.status;
    }

    // Update patient status if it changed
    if (newStatus !== activePatient.status) {
      try {
        // Map workflow status back to Supabase status
        const supabaseStatus = newStatus === 'checked-in' ? 'self_checkin' :
                              newStatus === 'assessed' ? 'clinical_assessment' : 'in_treatment';
        
        // Update in Supabase
        await updatePatientStatus(activeId, supabaseStatus);
        
        // Reload patients to reflect changes
        await loadPatients();
        
        toast.success(`${activePatient.name} moved to ${newStatus.replace('-', ' ')} stage`);
      } catch (error) {
        console.error('Error updating patient status:', error);
        toast.error('Failed to update patient status');
      }
    }

    setActiveId(null);
  };

  const activePatient = activeId ? patients.find(p => p.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Triage Workflow Board</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time patient flow management for emergency department
          </p>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{patients.length}</div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{checkedInPatients.length}</div>
                <div className="text-sm text-muted-foreground">Awaiting Assessment</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{assessedPatients.length}</div>
                <div className="text-sm text-muted-foreground">Awaiting Treatment</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{inTreatmentPatients.length}</div>
                <div className="text-sm text-muted-foreground">In Treatment</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Column
              title="Self Check-In Complete"
              patients={checkedInPatients}
              status="checked-in"
              icon={UserCheck}
              themeColor="blue"
            />
            <Column
              title="Clinical Assessment Complete"
              patients={assessedPatients}
              status="assessed"
              icon={Heart}
              themeColor="orange"
            />
            <Column
              title="In Treatment"
              patients={inTreatmentPatients}
              status="in-treatment"
              icon={Activity}
              themeColor="green"
            />
          </div>

          <DragOverlay>
            {activePatient && (
              <PatientCard patient={activePatient} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TriageWorkflow;