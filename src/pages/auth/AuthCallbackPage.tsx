
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
        
        // If there's an error parameter in the URL, handle it
        if (errorParam) {
          console.error(`Auth error returned from provider: ${errorParam} - ${errorDescription}`);
          throw new Error(errorDescription || `Authentication failed with error: ${errorParam}`);
        }
        
        // For social logins (like Google), sometimes the code might not be in the URL yet
        // but the provider will be mentioned - we should wait a moment before showing an error
        if (!code && provider) {
          // Wait briefly to see if code arrives (common issue with social auth redirects)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check params again after brief delay
          const codeAfterDelay = new URLSearchParams(window.location.search).get('code');
          
          if (!codeAfterDelay) {
            // If we still don't have a code but we know which provider was used, 
            // the user may have been authenticated already - let's check
            const { data: sessionData } = await supabase.auth.getSession();
            
            if (sessionData.session) {
              // User is already authenticated, redirect to home
              console.log('No code in URL but user already has a valid session');
              toast({
                title: `${provider} Sign-In successful!`,
                description: "Welcome back!",
              });
              
              navigate("/", { replace: true });
              return;
            } else {
              // Only throw error if we don't have a session either
              throw new Error('Authentication code missing from callback. Please try logging in again.');
            }
          }
        }
        
        // If we have a code, exchange it for a session
        if (code) {
          console.log('Processing OAuth callback with code');
          
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
          
          // Redirect to home
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        console.error("Error during OAuth callback:", err);
        setError(err.message || "Authentication failed. Please try again.");
        
        // Check if we have a session despite the error
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // If we have a session despite the error, just redirect to home
          console.log('Error occurred but user has a valid session, redirecting to home');
          navigate("/", { replace: true });
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
          }, 3000);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-shareai-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Completing your login...</h2>
        <p className="text-gray-500">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
