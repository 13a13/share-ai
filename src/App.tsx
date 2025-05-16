
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useMigration } from './hooks/useMigration';
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
    },
  },
});

// Wrapper component to handle auth state and render appropriate routes
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isMigrating, migrationError } = useMigration();

  // If still loading auth state, show a loader
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-shareai-teal mb-4" />
        <p className="text-lg">Loading your session...</p>
      </div>
    );
  }

  return (
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
          {/* Auth Routes - accessible when not authenticated */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Landing page route */}
          <Route path="/" element={<Index />} />
          
          {/* Protected Routes - require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
  );
};

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
