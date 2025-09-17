import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import VarianceAnalysis from "./pages/VarianceAnalysis";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import SalesAnalysis from "./pages/SalesAnalysis";
import EnhancedForecasting from "./pages/EnhancedForecasting";
import ImportData from "./pages/ImportData";
import Reports from "./pages/Reports";
import Templates from "./pages/Templates";
import ReportBuilder from "./pages/ReportBuilder";
import FinancialRatios from "./pages/FinancialRatios";
import NetSuiteIntegration from "./pages/NetSuiteIntegration";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider defaultTheme="light"
      storageKey="prima-ui-theme"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={
              <AppLayout>
                <Index />
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
                <EnhancedForecasting />
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
            <Route path="/reports" element={
              <AppLayout>
                <Reports />
              </AppLayout>
            } />
            <Route path="/templates" element={
              <AppLayout>
                <Templates />
              </AppLayout>
            } />
            <Route path="/report-builder" element={
              <AppLayout>
                <ReportBuilder />
              </AppLayout>
            } />
            <Route path="/ratios" element={
              <AppLayout>
                <FinancialRatios />
              </AppLayout>
            } />
            <Route path="/netsuite" element={
              <AppLayout>
                <NetSuiteIntegration />
              </AppLayout>
            } />
            <Route path="/account-settings" element={
              <AppLayout>
                <AccountSettings />
              </AppLayout>
            } />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}