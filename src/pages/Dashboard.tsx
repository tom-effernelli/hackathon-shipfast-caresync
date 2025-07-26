import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  UserCheck, 
  Users, 
  Heart, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  Building2,
  Bell,
  BarChart3,
  Eye,
  UserPlus,
  Zap
} from "lucide-react";
import { fetchPatients, fetchDoctors } from "@/lib/supabase-data";
import { toast } from "sonner";

const Dashboard = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      setLastRefresh(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patientsData, doctorsData] = await Promise.all([
        fetchPatients(),
        fetchDoctors()
      ]);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard metrics
  const totalPatients = patients.length;
  const criticalCases = patients.filter(p => p.urgency_level === 'critical').length;
  const highPriority = patients.filter(p => p.urgency_level === 'high').length;
  const checkedInPatients = patients.filter(p => p.workflow_status === 'self_checkin').length;
  const assessmentPatients = patients.filter(p => p.workflow_status === 'clinical_assessment').length;
  const treatmentPatients = patients.filter(p => p.workflow_status === 'in_treatment').length;
  const availableDoctors = doctors.filter(d => d.availability).length;
  const totalDoctors = doctors.length;
  
  // Calculate average wait time (mock calculation)
  const avgWaitTime = patients.length > 0 ? 
    Math.round(patients.reduce((sum, p) => sum + (p.estimated_wait_time || 45), 0) / patients.length) : 0;

  // Calculate ER capacity (mock calculation based on patients vs available doctors)
  const erCapacity = totalDoctors > 0 ? Math.min(100, Math.round((totalPatients / (totalDoctors * 3)) * 100)) : 0;

  // Recent activity (mock data)
  const recentActivity = [
    { time: '2 min ago', action: 'New critical patient checked in', type: 'critical', patient: 'Sarah Johnson' },
    { time: '5 min ago', action: 'Patient assigned to Dr. Smith', type: 'success', patient: 'Michael Brown' },
    { time: '8 min ago', action: 'Assessment completed', type: 'info', patient: 'Emma Wilson' },
    { time: '12 min ago', action: 'Treatment started', type: 'treatment', patient: 'David Lee' },
    { time: '15 min ago', action: 'New patient checked in', type: 'checkin', patient: 'Lisa Garcia' }
  ];

  // Current alerts
  const alerts = [
    { type: 'critical', message: `${criticalCases} critical cases requiring immediate attention` },
    { type: 'warning', message: `${checkedInPatients} patients awaiting clinical assessment` },
    { type: 'info', message: `ER at ${erCapacity}% capacity` }
  ].filter(alert => 
    (alert.type === 'critical' && criticalCases > 0) ||
    (alert.type === 'warning' && checkedInPatients > 2) ||
    (alert.type === 'info' && erCapacity > 70)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading ER Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-accent/5 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">ER Command Center</h1>
                <p className="text-muted-foreground">Real-time emergency department operations</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Last updated: {lastRefresh.toLocaleTimeString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live data</span>
              </div>
            </div>
          </div>

          {/* Emergency Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className={`flex items-center gap-2 p-3 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalPatients}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+12% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Cases</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalCases}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Immediate attention required</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Wait Time</CardTitle>
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{avgWaitTime}m</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                <span>-5m from average</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doctors Available</CardTitle>
                <Stethoscope className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{availableDoctors}/{totalDoctors}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>{Math.round((availableDoctors/totalDoctors)*100)}% available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Patient Workflow Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <UserCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{checkedInPatients}</div>
                  <div className="text-sm text-blue-700">Awaiting Assessment</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Heart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{assessmentPatients}</div>
                  <div className="text-sm text-orange-700">Awaiting Treatment</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{treatmentPatients}</div>
                  <div className="text-sm text-green-700">In Treatment</div>
                </div>
              </div>

              {/* ER Capacity Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ER Capacity</span>
                  <span className="text-sm font-bold">{erCapacity}%</span>
                </div>
                <Progress 
                  value={erCapacity} 
                  className={`h-3 ${erCapacity > 80 ? 'bg-red-100' : erCapacity > 60 ? 'bg-orange-100' : 'bg-green-100'}`}
                />
                <div className="text-xs text-muted-foreground">
                  {erCapacity < 50 ? 'Normal capacity' : 
                   erCapacity < 80 ? 'Approaching capacity' : 
                   'Near capacity - consider overflow protocols'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'critical' ? 'bg-red-500' :
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'treatment' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">{activity.patient} • {activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/patient-checkin">
                <Button className="w-full h-16 flex flex-col gap-1" size="lg">
                  <UserPlus className="w-5 h-5" />
                  <span>New Patient Check-In</span>
                </Button>
              </Link>
              
              <Link to="/triage">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" size="lg">
                  <Heart className="w-5 h-5" />
                  <span>Start Triage</span>
                </Button>
              </Link>
              
              <Link to="/">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" size="lg">
                  <Activity className="w-5 h-5" />
                  <span>Workflow Board</span>
                </Button>
              </Link>
              
              <Link to="/patient-management">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" size="lg">
                  <Eye className="w-5 h-5" />
                  <span>Patient Management</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sponsor Recognition */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">SHIP FAST HACKATHON 2025</h3>
              </div>
              <p className="text-muted-foreground">
                AI-Powered Medical Triage System - Revolutionizing Emergency Care
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Powered by Unaite
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Built with Lovable
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  AI by Cerebras & Anthropic
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Enhanced by Windsurf
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;