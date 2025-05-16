
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get the parameters from URL query params
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const provider = searchParams.get('provider');
        const fullUrl = window.location.href;
        
        console.log('Auth callback received with URL:', fullUrl);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        // If there's an error parameter in the URL, handle it
        if (errorParam) {
          console.error(`Auth error returned from provider: ${errorParam} - ${errorDescription}`);
          throw new Error(errorDescription || `Authentication failed with error: ${errorParam}`);
        }
        
        if (!code) {
          console.error('No code provided in the callback URL:', fullUrl);
          throw new Error('No authentication code received. This can happen if the authentication process was interrupted or if there\'s a configuration mismatch between Supabase and the provider.');
        }
        
        // Extra logging for Google auth
        if (provider === 'google') {
          console.log('Processing Google OAuth callback');
        }
        
        console.log('Processing OAuth callback with code');
        
        // Exchange the code for a session
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
        
        // Special success messaging for Google
        const successMessage = provider === 'google' 
          ? 'Google Sign-In successful!' 
          : 'Login successful';
        
        toast({
          title: successMessage,
          description: "Welcome back!",
        });
        
        // Redirect to home or requested page
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
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

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
          <p className="text-gray-500">{isProcessing ? "Please wait while we authenticate you." : "Authentication complete, redirecting..."}</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallbackPage;
