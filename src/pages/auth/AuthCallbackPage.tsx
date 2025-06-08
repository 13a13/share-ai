
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          toast({
            variant: "destructive",
            title: "Verification failed",
            description: error.message,
          });
          navigate("/login");
          return;
        }

        if (data.session) {
          toast({
            title: "Email verified successfully",
            description: "Welcome! Your account is now active.",
          });
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-verifyvision-teal mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
