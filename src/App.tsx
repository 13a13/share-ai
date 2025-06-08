
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from './components/Header';
import Footer from './components/Footer';
import { Index } from './pages/Index';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyCreationPage from './pages/PropertyCreationPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import ReportsPage from './pages/ReportsPage';
import ReportCreationPage from './pages/ReportCreationPage';
import ReportEditPage from './pages/ReportEditPage';
import ReportViewPage from './pages/ReportViewPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ImageDiagnosticPage from "./pages/ImageDiagnosticPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
            <Route path="/properties/new" element={<ProtectedRoute><PropertyCreationPage /></ProtectedRoute>} />
            <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/reports/new" element={<ProtectedRoute><ReportCreationPage /></ProtectedRoute>} />
            <Route path="/reports/:id" element={<ProtectedRoute><ReportEditPage /></ProtectedRoute>} />
            <Route path="/reports/:id/view" element={<ProtectedRoute><ReportViewPage /></ProtectedRoute>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/image-diagnostic" element={<ProtectedRoute><ImageDiagnosticPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
