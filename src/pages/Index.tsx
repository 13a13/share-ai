
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Index page that redirects to Dashboard if authenticated or Login if not
 * This is a placeholder that shouldn't be visible since we now redirect at the router level
 */
const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If still checking authentication, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mx-auto mb-4" />
          <h2 className="text-xl font-medium">Loading your account...</h2>
        </div>
      </div>
    );
  }

  // Redirect to the appropriate page based on auth state
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export default Index;
