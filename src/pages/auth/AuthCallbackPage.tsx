
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Force redirect after timeout to prevent getting stuck
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached, forcing redirect to dashboard");
      navigate("/dashboard", { replace: true });
    }, 5000); // 5 seconds maximum wait time

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        console.log("Auth callback initiated");
        
        // Get the parameters from URL query params
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const provider = searchParams.get('provider');
        
        // If there's an error parameter in the URL, handle it
        if (errorParam) {
          console.error(`Auth error returned from provider: ${errorParam} - ${errorDescription}`);
          throw new Error(errorDescription || `Authentication failed with error: ${errorParam}`);
        }
        
        // Check if we already have an active session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log("Active session found, redirecting to dashboard");
          toast({
            title: `Sign-In successful!`,
            description: "Welcome back!",
          });
          
          // Complete the progress bar for better UX
          setProgress(100);
          
          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
          return;
        }
        
        // If we have a code, exchange it for a session
        if (code) {
          console.log('Processing OAuth callback with code');
          setProgress(50);
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            throw exchangeError;
          }
          
          if (!data.session) {
            console.error('No session returned after code exchange');
            throw new Error('No session returned after authentication. Please try again.');
          }
          
          console.log('Authentication successful, user:', data.session.user);
          setProgress(80);
          
          // Success message
          toast({
            title: "Sign-In successful!",
            description: "Welcome back!",
          });
          
          // Complete the progress bar for better UX
          setProgress(100);
          
          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
          return;
        }
        
        // If we don't have a code or session, try to get one more time after a delay
        console.log("No code or session found, waiting briefly...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check one more time after delay
        const { data: finalSessionCheck } = await supabase.auth.getSession();
        
        if (finalSessionCheck.session) {
          console.log("Session found after delay, redirecting");
          toast({
            title: "Sign-In successful!",
            description: "Welcome back!",
          });
          
          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
          return;
        }
        
        // If we still don't have a session, redirect to login
        console.log("No session found after multiple attempts");
        throw new Error("Could not complete authentication. Please try again.");
        
      } catch (err: any) {
        console.error("Error during OAuth callback:", err);
        setError(err.message || "Authentication failed. Please try again.");
        
        // Final attempt - check if we have a session despite the error
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // If we have a session despite the error, just redirect to dashboard
          console.log('Error occurred but user has a valid session, redirecting to dashboard');
          navigate("/dashboard", { replace: true });
        } else {
          // Only show error toast and redirect to login if no session exists
          toast({
            title: "Authentication failed",
            description: err.message || "Could not complete login. Please try again.",
            variant: "destructive",
          });
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      } finally {
        setIsProcessing(false);
        // Clear the intervals and timeouts
        clearInterval(progressInterval);
        clearTimeout(timeoutId);
      }
    };

    handleCallback();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [navigate, searchParams, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full">
        <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Completing your login...</h2>
        <p className="text-gray-500 mb-6">Please wait while we authenticate you.</p>
        
        <div className="w-full mb-2">
          <ProgressIndicator 
            value={progress} 
            isLoading={true} 
            variant="progress"
            showPercentage={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
