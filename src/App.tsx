import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import PatientCheckIn from "./pages/PatientCheckIn";
import PatientManagement from "./pages/PatientManagement";
import Triage from "./pages/Triage";
import TriageWorkflow from "./pages/TriageWorkflow";
import Statistics from "./pages/Statistics";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Heart } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col">
                      <header className="h-12 flex items-center border-b bg-background px-4">
                        <SidebarTrigger className="mr-4" />
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-primary" />
                          <h1 className="font-semibold">ER Command Center</h1>
                        </div>
                      </header>
                      <div className="flex-1">
                        <Routes>
                          <Route path="/" element={<TriageWorkflow />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/patient-checkin" element={<PatientCheckIn />} />
                          <Route path="/patient-management" element={<PatientManagement />} />
                          <Route path="/triage" element={<Triage />} />
                          <Route path="/statistics" element={
                            <ProtectedRoute requiredRole="admin">
                              <Statistics />
                            </ProtectedRoute>
                          } />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
