import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Users, Activity, Brain, UserCircle } from 'lucide-react'
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
  const { toast } = useToast()

  useEffect(() => {
    loadData()
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
      const matchedDoctors = await matchDoctors(patient.id, patient.medical_history || '')
      console.log('Matched doctors for', patient.name, ':', matchedDoctors)
      toast({
        title: "Success",
        description: `Found ${matchedDoctors.length} available doctors for ${patient.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to match doctors",
        variant: "destructive",
      })
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

  const getStatusColor = (status: Patient['workflow_status']) => {
    switch (status) {
      case 'self_checkin': return 'bg-blue-100 text-blue-800'
      case 'clinical_assessment': return 'bg-orange-100 text-orange-800'
      case 'in_treatment': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency?: Patient['urgency_level']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
        
        <div className="flex gap-2">
          <Button onClick={handleRankPatients} className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Rank Patients
          </Button>
          <Button variant="outline" onClick={loadData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient List
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
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="font-semibold">{patient.name}</span>
                      <Badge variant="outline">Age {patient.age}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {patient.id}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(patient.workflow_status)}>
                      {patient.workflow_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {patient.urgency_level && (
                      <Badge className={getUrgencyColor(patient.urgency_level)}>
                        {patient.urgency_level.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {patient.medical_history && (
                  <div className="text-sm">
                    <span className="font-medium">Medical History: </span>
                    {patient.medical_history}
                  </div>
                )}

                {(patient.estimated_wait_time || patient.estimated_treatment_duration) && (
                  <div className="flex gap-4 text-sm">
                    {patient.estimated_wait_time && (
                      <span>Wait Time: {patient.estimated_wait_time} min</span>
                    )}
                    {patient.estimated_treatment_duration && (
                      <span>Treatment Duration: {patient.estimated_treatment_duration} min</span>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleMatchDoctors(patient)}
                  >
                    Match Doctors
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePredictMortality(patient)}
                  >
                    Risk Analysis
                  </Button>
                </div>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}