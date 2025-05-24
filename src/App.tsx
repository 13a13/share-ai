
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "./components/ui/toaster";
import React, { Suspense } from 'react';
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/Dashboard";
import ReportViewPage from "./pages/ReportViewPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyCreationPage from "./pages/PropertyCreationPage";
import ReportsPage from "./pages/ReportsPage";
import ReportCreationPage from "./pages/ReportCreationPage";
import ReportEditPage from "./pages/ReportEditPage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/properties" 
            element={
              <ProtectedRoute>
                <PropertiesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/properties/new" 
            element={
              <ProtectedRoute>
                <PropertyCreationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/properties/:propertyId" 
            element={
              <ProtectedRoute>
                <PropertyDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/new" 
            element={
              <ProtectedRoute>
                <ReportCreationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/new/:propertyId" 
            element={
              <ProtectedRoute>
                <ReportCreationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/:reportId" 
            element={
              <ProtectedRoute>
                <ReportViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/:reportId/edit" 
            element={
              <ProtectedRoute>
                <ReportEditPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
};

export default App;
