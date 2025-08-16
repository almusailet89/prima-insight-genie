import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import OverviewDashboard from "./pages/OverviewDashboard";
import VarianceAnalysis from "./pages/VarianceAnalysis";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import SalesAnalysis from "./pages/SalesAnalysis";
import Forecasting from "./pages/Forecasting";
import ImportData from "./pages/ImportData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <AppLayout>
                <OverviewDashboard />
              </AppLayout>
            } />
            <Route path="/variance" element={
              <AppLayout>
                <VarianceAnalysis />
              </AppLayout>
            } />
            <Route path="/sales" element={
              <AppLayout>
                <SalesAnalysis />
              </AppLayout>
            } />
            <Route path="/forecasting" element={
              <AppLayout>
                <Forecasting />
              </AppLayout>
            } />
            <Route path="/scenarios" element={
              <AppLayout>
                <ScenarioSimulator />
              </AppLayout>
            } />
            <Route path="/import" element={
              <AppLayout>
                <ImportData />
              </AppLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
