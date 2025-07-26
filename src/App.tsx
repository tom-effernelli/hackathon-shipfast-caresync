import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import PatientCheckIn from "./pages/PatientCheckIn";
import PatientManagement from "./pages/PatientManagement";
import Triage from "./pages/Triage";
import TriageWorkflow from "./pages/TriageWorkflow";
import Statistics from "./pages/Statistics";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
            <Route path="/" element={
              <ProtectedRoute>
                <Navigation />
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/patient-checkin" element={
              <ProtectedRoute>
                <Navigation />
                <PatientCheckIn />
              </ProtectedRoute>
            } />
            <Route path="/patient-management" element={
              <ProtectedRoute>
                <Navigation />
                <PatientManagement />
              </ProtectedRoute>
            } />
            <Route path="/triage" element={
              <ProtectedRoute>
                <Navigation />
                <Triage />
              </ProtectedRoute>
            } />
            <Route path="/triage-workflow" element={
              <ProtectedRoute>
                <Navigation />
                <TriageWorkflow />
              </ProtectedRoute>
            } />
            <Route path="/statistics" element={
              <ProtectedRoute requiredRole="admin">
                <Navigation />
                <Statistics />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
