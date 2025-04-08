
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import PropertiesPage from "./pages/PropertiesPage";
import ReportsPage from "./pages/ReportsPage";
import ReportCreationPage from "./pages/ReportCreationPage";
import ReportEditPage from "./pages/ReportEditPage";
import ReportViewPage from "./pages/ReportViewPage";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/new" element={<ReportCreationPage />} />
              <Route path="/reports/new/:propertyId" element={<ReportCreationPage />} />
              <Route path="/reports/:reportId" element={<ReportViewPage />} />
              <Route path="/reports/:reportId/edit" element={<ReportEditPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
