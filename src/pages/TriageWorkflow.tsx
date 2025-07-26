import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchPatients, updatePatientStatus, type Patient as SupabasePatient } from "@/lib/supabase-data";
import { demoPatients } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Clock, User, Activity, AlertTriangle, CheckCircle, UserCheck, Stethoscope, Timer, Heart, BarChart3, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { ClinicalAssessmentModal } from "@/components/ClinicalAssessmentModal";
import { LiveNotification } from "@/components/LiveNotification";
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
  const [progress, setProgress] = useState<{
    percentage: number;
    timeElapsed: number;
    actualElapsed: number;
    isOverdue: boolean;
  }>({
    percentage: 0,
    timeElapsed: 0,
    actualElapsed: 0,
    isOverdue: false
  });
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

      // Cap elapsed time at estimated duration for logical display
      const cappedElapsedMinutes = Math.min(elapsedMinutes, totalDuration);
      const percentage = Math.round(cappedElapsedMinutes / totalDuration * 100);
      const isOverdue = elapsedMinutes > totalDuration;
      setProgress({
        percentage,
        timeElapsed: cappedElapsedMinutes,
        actualElapsed: elapsedMinutes,
        isOverdue
      });
    };

    // Update immediately
    updateProgress();

    // Update every 30 seconds for real-time progress
    const interval = setInterval(updateProgress, 30000);
    return () => clearInterval(interval);
  }, [patient.status, patient.treatmentStartTime, patient.estimated_treatment_duration]);
  return progress;
};
const PatientCard = ({
  patient,
  isDragging,
  onCardClick
}: {
  patient: Patient;
  isDragging?: boolean;
  onCardClick?: (patient: Patient) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: patient.id
  });
  const progressData = useRealTimeProgress(patient);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getPatientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white'; 
      case 'moderate': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-primary text-primary-foreground';
    }
  };
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  // Helper function to format treatment progress display
  const formatTreatmentProgress = (progressData: any, estimatedDuration: number) => {
    if (progressData.isOverdue) {
      return `Treatment: Completed ✓ (${progressData.actualElapsed} min)`;
    } else if (progressData.percentage >= 100) {
      return `Treatment: Completed ✓`;
    } else {
      return `Treatment: ${progressData.timeElapsed}/${estimatedDuration} min (${progressData.percentage}%)`;
    }
  };
  const handleCardClick = (e: React.MouseEvent) => {
    if (patient.status === 'checked-in' && onCardClick) {
      e.stopPropagation();
      onCardClick(patient);
      return;
    }
  };

  const cardProps = patient.status === 'checked-in' 
    ? { onClick: handleCardClick }
    : { ...attributes, ...listeners };

  return <motion.div
    ref={setNodeRef} 
    style={style}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
  >
    <Card 
      {...cardProps}
      className={`${patient.status === 'checked-in' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} hover:shadow-lg transition-all duration-300 ${isDragging ? 'ring-2 ring-primary' : ''} ${patient.urgency_level === 'critical' ? 'ring-2 ring-red-500 shadow-red-500/20' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={getAvatarColor(patient.urgency_level)}>
                {getPatientInitials(patient.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">{patient.name}</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{patient.age}y</span>
                {patient.gender && <span>• {patient.gender[0].toUpperCase()}</span>}
              </div>
            </div>
          </div>
          {patient.urgency_level === 'critical' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Heart className="w-4 h-4 text-red-500" />
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {patient.chiefComplaint || patient.medical_history || 'Medical consultation'}
        </p>

        {patient.status === 'checked-in' && <>
            <Badge variant="outline" className="text-xs">
              <UserCheck className="w-3 h-3 mr-1" />
              Awaiting Clinical Assessment
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Check-in: {formatTime(patient.checkInTime)} ({getTimeSince(patient.checkInTime)})
            </div>
          </>}

        {patient.status === 'assessed' && <>
            <div className="space-y-2">
              <Badge variant={getUrgencyColor(patient.urgency_level || 'low')} className={`text-xs ${
                patient.urgency_level === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                patient.urgency_level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                patient.urgency_level === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {patient.triageCategory}
              </Badge>
              <div className="text-sm font-medium text-primary">
                Wait Time: {patient.estimated_wait_time ? `${patient.estimated_wait_time} min` : 'TBD'}
              </div>
              {patient.assignedDoctor && <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Stethoscope className="w-3 h-3" />
                  {patient.assignedDoctor}
                </div>}
            </div>
          </>}

        {patient.status === 'in-treatment' && <>
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
                  <span className={`font-semibold ${progressData.isOverdue ? 'text-green-600' : 'text-success'}`}>
                    {progressData.isOverdue ? 'Complete' : `${progressData.percentage}%`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ease-in-out ${progressData.isOverdue ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'}`} style={{
                width: `${Math.min(progressData.percentage, 100)}%`
              }} />
                </div>
                <div className={`text-xs font-medium ${progressData.isOverdue ? 'text-green-600' : 'text-success/80'}`}>
                  {formatTreatmentProgress(progressData, patient.estimated_treatment_duration || 60)}
                </div>
              </div>
            </div>
          </>}
      </CardContent>
    </Card>
  </motion.div>;
};
const Column = ({
  title,
  patients,
  status,
  icon: Icon,
  themeColor,
  onPatientCardClick
}: {
  title: string;
  patients: Patient[];
  status: string;
  icon: any;
  themeColor: string;
  onPatientCardClick?: (patient: Patient) => void;
}) => {
  return <div className="flex-1 min-w-0">
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
            <AnimatePresence>
              <div className="space-y-3">
                {patients.map((patient, index) => (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <PatientCard 
                      patient={patient} 
                      onCardClick={status === 'checked-in' ? onPatientCardClick : undefined}
                    />
                  </motion.div>
                ))}
                {patients.length === 0 && (
                  <motion.div 
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients in this stage</p>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          </SortableContext>
        </CardContent>
      </Card>
    </div>;
};
const TriageWorkflow = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    loadPatients();
  }, []);
  const loadPatients = async () => {
    try {
      // Use demo data for impressive pitch demo
      const isDemoMode = true; // Toggle for demo vs real data
      
      let sourcePatients;
      if (isDemoMode) {
        sourcePatients = demoPatients.map((p, index) => ({
          ...p,
          id: `demo-${index}`,
          created_at: p.checkInTime || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          patient_submission_data: null,
          injury_image_base64: null,
          aura_analysis_result: null
        }));
      } else {
        sourcePatients = await fetchPatients();
      }

      // Transform patients to workflow format
      const workflowPatients: Patient[] = sourcePatients.map(p => {
        let treatmentStartTime: string | undefined = undefined;

        // Fix timestamp calculation by generating realistic treatment start times
        if (p.workflow_status === 'in_treatment' && p.estimated_treatment_duration) {
          const now = new Date();
          const duration = p.estimated_treatment_duration;
          // Generate realistic start times (10-80% complete, never 100%)
          const progressPercent = Math.random() * 70 + 10; // 10-80%
          const elapsedMinutes = Math.floor(duration * progressPercent / 100);
          const startTime = new Date(now.getTime() - elapsedMinutes * 60 * 1000);
          treatmentStartTime = startTime.toISOString();
          console.log(`Patient ${p.name}: ${elapsedMinutes}/${duration} min (${Math.round(progressPercent)}%)`);
        }
        return {
          ...p,
          status: p.workflow_status === 'self_checkin' ? 'checked-in' : p.workflow_status === 'clinical_assessment' ? 'assessed' : 'in-treatment',
          chiefComplaint: p.medical_history || 'Medical consultation',
          checkInTime: p.created_at,
          treatmentStartTime,
          estimatedWaitTime: p.estimated_wait_time ? `${p.estimated_wait_time} minutes` : undefined,
          estimatedTreatmentDuration: p.estimated_treatment_duration,
          assignedDoctor: p.assigned_doctor,
          triageCategory: p.urgency_level ? `${p.urgency_level.charAt(0).toUpperCase() + p.urgency_level.slice(1)} Priority` : 'Standard'
        };
      });
      setPatients(workflowPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patient data');
    }
  };
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  const filteredPatients = patients.filter(patient => patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || (patient.chiefComplaint || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const checkedInPatients = filteredPatients.filter(p => p.status === 'checked-in');

  // Sort assessed patients by urgency priority (Critical → High → Moderate → Low)
  const urgencyOrder = {
    'critical': 0,
    'high': 1,
    'moderate': 2,
    'low': 3
  };
  const assessedPatients = filteredPatients.filter(p => p.status === 'assessed').sort((a, b) => {
    const aUrgency = urgencyOrder[a.urgency_level as keyof typeof urgencyOrder] ?? 4;
    const bUrgency = urgencyOrder[b.urgency_level as keyof typeof urgencyOrder] ?? 4;
    if (aUrgency !== bUrgency) return aUrgency - bUrgency;

    // Within same urgency, sort by check-in time (longest waiting first)
    return new Date(a.checkInTime || 0).getTime() - new Date(b.checkInTime || 0).getTime();
  });
  const inTreatmentPatients = filteredPatients.filter(p => p.status === 'in-treatment');
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
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
        const supabaseStatus = newStatus === 'checked-in' ? 'self_checkin' : newStatus === 'assessed' ? 'clinical_assessment' : 'in_treatment';

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
  const handlePatientCardClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handlePatientUpdated = () => {
    loadPatients();
  };

  const activePatient = activeId ? patients.find(p => p.id === activeId) : null;
  return <div className="min-h-screen bg-background p-4">
      <LiveNotification />
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
            <Input placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-primary" />
                  <div className="text-2xl font-bold text-primary">{patients.length}</div>
                </div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div className="text-2xl font-bold text-orange-500">{checkedInPatients.length}</div>
                </div>
                <div className="text-sm text-muted-foreground">Awaiting Assessment</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div className="text-2xl font-bold text-yellow-500">{assessedPatients.length}</div>
                </div>
                <div className="text-sm text-muted-foreground">Ready for Treatment</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-green-500" />
                  <div className="text-2xl font-bold text-green-500">{inTreatmentPatients.length}</div>
                </div>
                <div className="text-sm text-muted-foreground">In Treatment</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        </div>

        {/* Workflow Columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
              <Column title="Check-in" patients={checkedInPatients} status="checked-in" icon={UserCheck} themeColor="blue" onPatientCardClick={handlePatientCardClick} />
              <Column title="Clinical Assessment" patients={assessedPatients} status="assessed" icon={Stethoscope} themeColor="orange" />
              <Column title="Treatment" patients={inTreatmentPatients} status="in-treatment" icon={Activity} themeColor="green" />
            </div>

          <DragOverlay>
            {activePatient && <PatientCard patient={activePatient} isDragging />}
          </DragOverlay>
        </DndContext>

        {/* Clinical Assessment Modal */}
        <ClinicalAssessmentModal
          patient={selectedPatient}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onPatientUpdated={handlePatientUpdated}
        />
        </motion.div>
      </div>
    </div>;
};
export default TriageWorkflow;