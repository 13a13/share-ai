
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import LandingPage from "./LandingPage";

/**
 * Index page that shows the landing page for unauthenticated users 
 * or redirects to Dashboard if authenticated
 */
const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If still checking authentication, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-verifyvision-teal mx-auto mb-4" />
          <h2 className="text-xl font-medium">Loading your account...</h2>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the landing page
  return <LandingPage />;
};

export default Index;
