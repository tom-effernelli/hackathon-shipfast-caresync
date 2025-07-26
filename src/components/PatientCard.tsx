import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserCheck, Brain, Eye, Clock, AlertTriangle } from 'lucide-react'
import { type Patient } from '@/lib/supabase-data'

interface PatientCardProps {
  patient: Patient
  isDetailed: boolean
  onMatchDoctor: (patient: Patient) => void
  onRiskAnalysis: (patient: Patient) => void
  onViewDetails: (patient: Patient) => void
  isMatching: boolean
}

export function PatientCard({ 
  patient, 
  isDetailed, 
  onMatchDoctor, 
  onRiskAnalysis, 
  onViewDetails,
  isMatching 
}: PatientCardProps) {
  const [waitTime, setWaitTime] = useState<string>('')

  // Calculate real-time wait time
  useEffect(() => {
    const updateWaitTime = () => {
      if (patient.created_at) {
        const now = new Date()
        const checkIn = new Date(patient.created_at)
        const diffMinutes = Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60))
        setWaitTime(`${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`)
      }
    }

    updateWaitTime()
    const interval = setInterval(updateWaitTime, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [patient.created_at])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getUrgencyBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'destructive'
      case 'high': return 'secondary'
      case 'moderate': return 'outline'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getUrgencyBadgeClass = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white hover:bg-red-600'
      case 'high': return 'bg-orange-500 text-white hover:bg-orange-600'
      case 'moderate': return 'bg-yellow-500 text-white hover:bg-yellow-600'
      case 'low': return 'bg-green-500 text-white hover:bg-green-600'
      default: return ''
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'self_checkin': return 'bg-blue-500 text-white'
      case 'clinical_assessment': return 'bg-orange-500 text-white'
      case 'in_treatment': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getCardBorderClass = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'border-l-4 border-l-red-500'
      case 'high': return 'border-l-4 border-l-orange-500'
      case 'moderate': return 'border-l-4 border-l-yellow-500'
      case 'low': return 'border-l-4 border-l-green-500'
      default: return 'border-l-4 border-l-gray-300'
    }
  }

  const shouldShowAlert = () => {
    if (!patient.created_at) return false
    const now = new Date()
    const checkIn = new Date(patient.created_at)
    const diffMinutes = Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60))
    return diffMinutes > 60 // Alert if waiting > 1 hour
  }

  return (
    <Card className={`${patient.workflow_status !== 'self_checkin' ? 'hover:shadow-md' : ''} transition-all duration-200 ${getCardBorderClass(patient.urgency_level)}`}>
      <CardContent className="p-4">
        {/* Ultra-Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(patient.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">{patient.name}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {patient.age}y
                </Badge>
                {patient.gender && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {patient.gender[0].toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                ID: {patient.id.slice(0, 8)}...
              </div>
            </div>
          </div>
          
          {/* Status & Urgency Badges */}
          <div className="flex gap-1 flex-shrink-0">
            {patient.urgency_level && (
              <Badge 
                variant={getUrgencyBadgeVariant(patient.urgency_level)}
                className={`text-xs px-2 py-1 ${getUrgencyBadgeClass(patient.urgency_level)}`}
              >
                {patient.urgency_level.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Essential Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Wait: {waitTime}
            </span>
            <Badge className={`text-xs px-2 py-0.5 ${getStatusBadgeClass(patient.workflow_status)}`}>
              {patient.workflow_status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {patient.assigned_doctor && (
            <div className="text-xs text-muted-foreground">
              Dr. {patient.assigned_doctor}
            </div>
          )}

          {/* Detailed View Additional Info */}
          {isDetailed && (
            <div className="space-y-2 pt-2 border-t">
              {patient.medical_history && (
                <div className="text-xs">
                  <span className="font-medium">History: </span>
                  <span className="text-muted-foreground">
                    {patient.medical_history.length > 100 
                      ? `${patient.medical_history.slice(0, 100)}...` 
                      : patient.medical_history
                    }
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {patient.estimated_wait_time && (
                  <div>
                    <span className="font-medium">Est. Wait: </span>
                    {patient.estimated_wait_time}m
                  </div>
                )}
                {patient.estimated_treatment_duration && (
                  <div>
                    <span className="font-medium">Treatment: </span>
                    {patient.estimated_treatment_duration}m
                  </div>
                )}
              </div>

              {patient.phone_number && (
                <div className="text-xs">
                  <span className="font-medium">Phone: </span>
                  {patient.phone_number}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1 mt-3 pt-2 border-t">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onMatchDoctor(patient)}
            disabled={isMatching || !!patient.assigned_doctor}
            className="flex-1 h-7 text-xs"
          >
            <UserCheck className="w-3 h-3 mr-1" />
            {patient.assigned_doctor ? 'Assigned' : 'Match'}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onRiskAnalysis(patient)}
            className="flex-1 h-7 text-xs"
          >
            <Brain className="w-3 h-3 mr-1" />
            Risk
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewDetails(patient)}
            className="flex-1 h-7 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>

        {/* Alert for long wait times */}
        {shouldShowAlert() && (
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            Long wait time - Priority review needed
          </div>
        )}
      </CardContent>
    </Card>
  )
}