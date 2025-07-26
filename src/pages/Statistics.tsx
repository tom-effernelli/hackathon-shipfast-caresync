import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, Calendar, Clock, Heart } from "lucide-react";
import { generateMockStatisticsData } from "@/lib/api";

const Statistics = () => {
  const [timeRange, setTimeRange] = useState("6months");
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    // Generate mock data for demonstration
    const mockData = generateMockStatisticsData();
    setStatisticsData(mockData);
  }, []);

  // Calculate totals and trends
  const totalArrivals = statisticsData.reduce((sum, month) => {
    return sum + Object.keys(month)
      .filter(key => key !== 'month')
      .reduce((monthSum, type) => monthSum + month[type], 0);
  }, 0);

  const emergencyTypes = ['Cardiac', 'Trauma', 'Pediatric', 'Respiratory', 'Neurological', 'Other'];
  
  // Pie chart data
  const pieData = emergencyTypes.map(type => ({
    name: type,
    value: statisticsData.reduce((sum, month) => sum + (month[type] || 0), 0),
    color: getTypeColor(type)
  }));

  // Peak hours data (mock)
  const peakHoursData = [
    { hour: '6AM', arrivals: 12 },
    { hour: '8AM', arrivals: 28 },
    { hour: '10AM', arrivals: 45 },
    { hour: '12PM', arrivals: 62 },
    { hour: '2PM', arrivals: 58 },
    { hour: '4PM', arrivals: 71 },
    { hour: '6PM', arrivals: 89 },
    { hour: '8PM', arrivals: 76 },
    { hour: '10PM', arrivals: 54 },
    { hour: '12AM', arrivals: 32 }
  ];

  // Seasonal trends data
  const seasonalData = statisticsData.map(month => ({
    month: month.month.split(' ')[0],
    totalArrivals: Object.keys(month)
      .filter(key => key !== 'month')
      .reduce((sum, type) => sum + month[type], 0),
    cardiac: month.Cardiac,
    trauma: month.Trauma,
    respiratory: month.Respiratory
  }));

  function getTypeColor(type: string) {
    const colors: { [key: string]: string } = {
      'Cardiac': '#ef4444',
      'Trauma': '#f97316', 
      'Pediatric': '#8b5cf6',
      'Respiratory': '#06b6d4',
      'Neurological': '#10b981',
      'Other': '#6b7280'
    };
    return colors[type] || '#6b7280';
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Hospital Analytics Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive emergency department statistics and trends
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="cardiac">Cardiac</SelectItem>
                    <SelectItem value="trauma">Trauma</SelectItem>
                    <SelectItem value="pediatric">Pediatric</SelectItem>
                    <SelectItem value="respiratory">Respiratory</SelectItem>
                    <SelectItem value="neurological">Neurological</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArrivals.toLocaleString()}</div>
              <Badge variant="secondary" className="mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% vs last period
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Critical Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {Math.floor(totalArrivals * 0.15).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">15% of all arrivals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47 min</div>
              <Badge variant="destructive" className="mt-1">
                +8 min vs target
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6-8 PM</div>
              <p className="text-sm text-muted-foreground">89 avg arrivals</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrivals Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Emergency Arrivals Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalArrivals" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Total Arrivals"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cardiac" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Cardiac"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trauma" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Trauma"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Emergency Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Emergency Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Emergency Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statisticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Cardiac" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Trauma" stackId="a" fill="#f97316" />
                  <Bar dataKey="Pediatric" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="Respiratory" stackId="a" fill="#06b6d4" />
                  <Bar dataKey="Neurological" stackId="a" fill="#10b981" />
                  <Bar dataKey="Other" stackId="a" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Daily Peak Hours Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="arrivals" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 text-sm">Seasonal Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                Winter months show 35% increase in cardiac emergencies and 45% increase in respiratory cases.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 text-sm">Peak Time Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700">
                Evening hours (6-8 PM) consistently show highest patient volume. Consider additional staffing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 text-sm">Efficiency Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                AI triage implementation has reduced average wait times by 23% over the past 3 months.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;