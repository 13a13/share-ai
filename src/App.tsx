
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyCreationPage from "./pages/PropertyCreationPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import ReportCreationPage from "./pages/ReportCreationPage";
import ReportEditPage from "./pages/ReportEditPage";
import ReportViewPage from "./pages/ReportViewPage";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useMigration } from './hooks/useMigration';
import { Loader2 } from "lucide-react";
import SecurityHeaders from "./components/security/SecurityHeaders";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
    },
  },
});

function App() {
  const { isMigrating, migrationError } = useMigration();
  
  // Force HTTPS redirect for non-localhost environments
  useEffect(() => {
    if (
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("127.0.0.1")
    ) {
      window.location.href = window.location.href.replace("http:", "https:");
    }
  }, []);

  return (
    <React.StrictMode>
      {/* Add security headers */}
      <SecurityHeaders />
      
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Header />
                {isMigrating && (
                  <div className="bg-amber-50 border-b border-amber-200 p-2 text-amber-700 text-center text-sm flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Syncing your data to the cloud...
                  </div>
                )}
                {migrationError && (
                  <div className="bg-red-50 border-b border-red-200 p-2 text-red-700 text-center text-sm flex items-center justify-center">
                    Error syncing data: {migrationError.message}
                  </div>
                )}
                <main className="flex-grow">
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
                    <Route path="/properties/new" element={<ProtectedRoute><PropertyCreationPage /></ProtectedRoute>} />
                    <Route path="/properties/:propertyId" element={<ProtectedRoute><PropertyDetailsPage /></ProtectedRoute>} />
                    <Route path="/reports/new/:propertyId" element={<ProtectedRoute><ReportCreationPage /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/reports/:reportId" element={<ProtectedRoute><ReportViewPage /></ProtectedRoute>} />
                    <Route path="/reports/:reportId/edit" element={<ProtectedRoute><ReportEditPage /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
