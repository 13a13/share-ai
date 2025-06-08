import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Index } from './pages';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { AuthCallbackPage } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/Profile';
import { PropertiesPage } from './pages/Properties';
import { PropertyCreationPage } from './pages/PropertyCreation';
import { PropertyDetailsPage } from './pages/PropertyDetails';
import { ReportsPage } from './pages/Reports';
import { ReportCreationPage } from './pages/ReportCreation';
import { ReportEditPage } from './pages/ReportEdit';
import { ReportViewPage } from './pages/ReportView';
import { CheckoutPage } from './pages/Checkout';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
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
