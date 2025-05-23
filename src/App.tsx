
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "./components/ui/toaster";
import React, { Suspense } from 'react';
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/Dashboard";
import ReportViewPage from "./pages/ReportViewPage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
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
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
};

export default App;
