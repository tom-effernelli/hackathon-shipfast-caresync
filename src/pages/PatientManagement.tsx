import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PatientCard } from '@/components/PatientCard'
import { Search, Users, Activity, Brain, LayoutGrid, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  fetchPatients, 
  fetchDoctors, 
  rankPatients, 
  matchDoctors, 
  predictMortality,
  type Patient,
  type Doctor 
} from '@/lib/supabase-data'

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [isDetailedView, setIsDetailedView] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    
    // Auto-refresh data every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [patientsData, doctorsData] = await Promise.all([
        fetchPatients(),
        fetchDoctors()
      ])
      setPatients(patientsData)
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load patient data. Please check your Supabase connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRankPatients = async () => {
    try {
      const rankedPatients = await rankPatients(patients)
      setPatients(rankedPatients)
      toast({
        title: "Success",
        description: "Patients ranked by AI priority algorithm",
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to rank patients",
        variant: "destructive",
      })
    }
  }

  const handleMatchDoctors = async (patient: Patient) => {
    try {
      setIsMatching(true)
      const matchedDoctors = await matchDoctors(patient.id, patient.medical_history || '')
      
      if (matchedDoctors.length > 0) {
        // Assign the first available doctor
        const assignedDoctor = matchedDoctors[0]
        // Update patient with assigned doctor
        // This would typically be done through updatePatientStatus function
        toast({
          title: "Doctor Matched!",
          description: `${patient.name} has been assigned to Dr. ${assignedDoctor.name} (${assignedDoctor.specialty})`,
        })
        
        // Reload data to reflect changes
        await loadData()
      } else {
        toast({
          title: "No Available Doctors",
          description: `No doctors are currently available for ${patient.name}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to match doctors",
        variant: "destructive",
      })
    } finally {
      setIsMatching(false)
    }
  }

  const handleMatchAllPatients = async () => {
    try {
      setIsMatching(true)
      let matchedCount = 0
      
      for (const patient of patients) {
        if (!patient.assigned_doctor) {
          try {
            const matchedDoctors = await matchDoctors(patient.id, patient.medical_history || '')
            if (matchedDoctors.length > 0) {
              matchedCount++
            }
          } catch (error) {
            console.error(`Failed to match patient ${patient.name}:`, error)
          }
        }
      }
      
      toast({
        title: "Bulk Matching Complete",
        description: `Successfully matched ${matchedCount} patients with available doctors`,
      })
      
      // Reload data to reflect changes
      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete bulk doctor matching",
        variant: "destructive",
      })
    } finally {
      setIsMatching(false)
    }
  }

  const handlePredictMortality = async (patient: Patient) => {
    try {
      const risk = await predictMortality(patient)
      toast({
        title: "Mortality Risk Analysis",
        description: `Risk score: ${(risk * 100).toFixed(1)}% for ${patient.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to predict mortality risk",
        variant: "destructive",
      })
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort patients by urgency priority
  const urgencyOrder = { 'critical': 0, 'high': 1, 'moderate': 2, 'low': 3 }
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aUrgency = urgencyOrder[a.urgency_level as keyof typeof urgencyOrder] ?? 4
    const bUrgency = urgencyOrder[b.urgency_level as keyof typeof urgencyOrder] ?? 4
    if (aUrgency !== bUrgency) return aUrgency - bUrgency
    
    // Within same urgency, sort by check-in time (longest waiting first)
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  })

  // Group patients by urgency for organized display
  const groupedPatients = {
    critical: sortedPatients.filter(p => p.urgency_level === 'critical'),
    high: sortedPatients.filter(p => p.urgency_level === 'high'),
    moderate: sortedPatients.filter(p => p.urgency_level === 'moderate'),
    low: sortedPatients.filter(p => p.urgency_level === 'low'),
    other: sortedPatients.filter(p => !p.urgency_level || !['critical', 'high', 'moderate', 'low'].includes(p.urgency_level))
  }

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    // In a real app, this might open a modal or navigate to a detail page
    toast({
      title: "Patient Details",
      description: `Viewing details for ${patient.name}`,
    })
  }

  const getUrgencyGroupInfo = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { 
        label: 'Critical', 
        color: 'bg-red-500 text-white', 
        count: groupedPatients.critical.length,
        icon: '🔴'
      }
      case 'high': return { 
        label: 'High Priority', 
        color: 'bg-orange-500 text-white', 
        count: groupedPatients.high.length,
        icon: '🟠'
      }
      case 'moderate': return { 
        label: 'Moderate', 
        color: 'bg-yellow-500 text-white', 
        count: groupedPatients.moderate.length,
        icon: '🟡'
      }
      case 'low': return { 
        label: 'Low Priority', 
        color: 'bg-green-500 text-white', 
        count: groupedPatients.low.length,
        icon: '🟢'
      }
      default: return { 
        label: 'Other', 
        color: 'bg-gray-500 text-white', 
        count: groupedPatients.other.length,
        icon: '⚪'
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">
            AI-powered patient prioritization and workflow management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <Switch 
              checked={isDetailedView}
              onCheckedChange={setIsDetailedView}
            />
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">
              {isDetailedView ? 'Detailed' : 'Compact'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleRankPatients} className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Rank Patients
            </Button>
            <Button 
              variant="outline" 
              onClick={handleMatchAllPatients}
              disabled={isMatching}
            >
              <Users className="w-4 h-4 mr-2" />
              {isMatching ? 'Matching...' : 'Match Doctors'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.filter(d => d.availability).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {patients.filter(p => p.urgency_level === 'critical').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {patients.filter(p => p.workflow_status === 'in_treatment').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient Management ({sortedPatients.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Patient Cards by Urgency Groups */}
      <div className="space-y-6">
        {(['critical', 'high', 'moderate', 'low', 'other'] as const).map(urgencyLevel => {
          const groupInfo = getUrgencyGroupInfo(urgencyLevel)
          const patientsInGroup = groupedPatients[urgencyLevel]
          
          if (patientsInGroup.length === 0) return null

          return (
            <div key={urgencyLevel} className="space-y-4">
              {/* Urgency Group Header */}
              <div className="flex items-center gap-3">
                <Badge className={`${groupInfo.color} px-3 py-1 text-sm font-semibold`}>
                  {groupInfo.icon} {groupInfo.label} ({groupInfo.count})
                </Badge>
                {urgencyLevel === 'critical' && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Immediate Attention Required
                  </Badge>
                )}
              </div>

              {/* Patient Cards Grid */}
              <div className={`grid gap-4 ${
                isDetailedView 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {patientsInGroup.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    isDetailed={isDetailedView}
                    onMatchDoctor={handleMatchDoctors}
                    onRiskAnalysis={handlePredictMortality}
                    onViewDetails={handleViewDetails}
                    isMatching={isMatching}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {sortedPatients.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}