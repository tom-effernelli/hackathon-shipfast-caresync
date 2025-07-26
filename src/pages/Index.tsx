import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, UserCheck, Users, Heart, Clock, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Activity className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold">Medical Triage AI</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Advanced medical triage system powered by AI for faster, more accurate patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/patient-checkin">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px] h-12 text-lg">
                <UserCheck className="w-5 h-5 mr-2" />
                Patient Check-In
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px] h-12 text-lg">
              <Activity className="w-5 h-5 mr-2" />
              Start Triage
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Emergency Room Management System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/patient-checkin" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Patient Self Check-In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Quick and easy self-service patient registration with QR code generation for streamlined triage process.
                </p>
                <div className="mt-4 flex items-center text-sm text-primary">
                  <Clock className="w-4 h-4 mr-1" />
                  Reduces wait times
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full border-accent/20">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>AI Triage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Claude AI-powered medical triage with urgency assessment, red flag detection, and clinical recommendations.
              </p>
              <div className="mt-4 flex items-center text-sm text-accent">
                <Heart className="w-4 h-4 mr-1" />
                Improves accuracy
              </div>
            </CardContent>
          </Card>

          <Card className="h-full border-warning/20">
            <CardHeader>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <CardTitle>Patient Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive patient and doctor management with AI-powered matching and priority ranking algorithms.
              </p>
              <div className="mt-4 flex items-center text-sm text-warning">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Priority-based care
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your emergency care?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the future of medical triage with our AI-powered system designed for healthcare professionals.
          </p>
          <Link to="/patient-checkin">
            <Button size="lg" className="h-12 px-8 text-lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
