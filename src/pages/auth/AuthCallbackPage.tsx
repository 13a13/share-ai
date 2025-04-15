
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash params
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("Error during OAuth callback:", err);
        setError(err.message || "Authentication failed. Please try again.");
        
        toast({
          title: "Authentication failed",
          description: err.message || "Could not complete login. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to login page after a delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-gray-500">Redirecting you back to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Completing your login...</h2>
          <p className="text-gray-500">Please wait while we authenticate you.</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallbackPage;
