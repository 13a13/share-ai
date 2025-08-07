
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Import all pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import ProfilePage from "./pages/ProfilePage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyCreationPage from "./pages/PropertyCreationPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import ReportsPage from "./pages/ReportsPage";
import ReportCreationPage from "./pages/ReportCreationPage";
import ReportEditPage from "./pages/ReportEditPage";
import ReportViewPage from "./pages/ReportViewPage";
import CheckoutPage from "./pages/CheckoutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root route - shows landing page or redirects based on auth */}
            <Route path="/" element={<Index />} />
            
            {/* Public routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            
            {/* Properties routes */}
            <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
            <Route path="/properties/new" element={<ProtectedRoute><PropertyCreationPage /></ProtectedRoute>} />
            <Route path="/properties/:propertyId" element={<ProtectedRoute><PropertyDetailsPage /></ProtectedRoute>} />
            
            {/* Reports routes */}
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/reports/new" element={<ProtectedRoute><ReportCreationPage /></ProtectedRoute>} />
            <Route path="/reports/new/:propertyId" element={<ProtectedRoute><ReportCreationPage /></ProtectedRoute>} />
            <Route path="/reports/:reportId/edit" element={<ProtectedRoute><ReportEditPage /></ProtectedRoute>} />
            <Route path="/reports/:reportId/view" element={<ProtectedRoute><ReportViewPage /></ProtectedRoute>} />
            <Route path="/reports/:reportId" element={<ProtectedRoute><ReportViewPage /></ProtectedRoute>} />
            <Route path="/reports/:reportId/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
