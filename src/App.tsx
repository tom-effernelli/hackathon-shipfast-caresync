import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PatientCheckIn from "./pages/PatientCheckIn";
import PatientManagement from "./pages/PatientManagement";
import Triage from "./pages/Triage";
import TriageWorkflow from "./pages/TriageWorkflow";
import Statistics from "./pages/Statistics";
import { Navigation } from "@/components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/patient-checkin" element={<PatientCheckIn />} />
          <Route path="/patient-management" element={<PatientManagement />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/triage-workflow" element={<TriageWorkflow />} />
          <Route path="/statistics" element={<Statistics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
