import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "./components/ui/toaster";
import React, { Suspense } from 'react';
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Shell } from "@/components/Shell";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Home } from "@/components/Home";
import { Login } from "@/components/auth/Login";
import { Register } from "@/components/auth/Register";
import { Logout } from "@/components/auth/Logout";
import { PropertyReport } from "@/components/PropertyReport";
import { PropertyReportEdit } from "@/components/PropertyReportEdit";
import { PropertyReportNew } from "@/components/PropertyReportNew";
import { PropertyReportView } from "@/components/PropertyReportView";
import { PropertyReportComparison } from "@/components/PropertyReportComparison";
import { PropertyReportComparisonEdit } from "@/components/PropertyReportComparisonEdit";
import { PropertyReportComparisonNew } from "@/components/PropertyReportComparisonNew";
import { PropertyReportComparisonView } from "@/components/PropertyReportComparisonView";
import { AccountSettings } from "@/components/AccountSettings";
import { About } from "@/components/About";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Shell>
                <Home />
              </Shell>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/property-report"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReport />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report/edit/:id"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportEdit />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report/new"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportNew />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report/view/:id"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportView />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report-comparison"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportComparison />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report-comparison/edit/:id"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportComparisonEdit />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report-comparison/new"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportComparisonNew />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/property-report-comparison/view/:id"
          element={
            <RequireAuth>
              <Shell>
                <PropertyReportComparisonView />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/account-settings"
          element={
            <RequireAuth>
              <Shell>
                <AccountSettings />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/about"
          element={
            <RequireAuth>
              <Shell>
                <About />
              </Shell>
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
