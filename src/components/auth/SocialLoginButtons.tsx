
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Apple } from "lucide-react";
import { Provider } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { securityService } from "@/lib/security/securityService";

interface SocialLoginButtonsProps {
  onError: (error: string) => void;
  isSubmitting: boolean;
}

const SocialLoginButtons = ({ onError, isSubmitting }: SocialLoginButtonsProps) => {
  const { socialLogin } = useAuth();

  const handleSocialLogin = async (provider: Provider) => {
    onError("");
    
    // Check rate limiting for social login
    const rateLimitCheck = securityService.checkRateLimit('socialLogin');
    if (!rateLimitCheck.allowed) {
      onError(rateLimitCheck.reason || "Too many login attempts");
      return;
    }
    
    try {
      await socialLogin(provider);
      // Redirect will be handled by the OAuth flow
    } catch (error: any) {
      onError(error.message || `Registration with ${provider} failed.`);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSocialLogin('google')} 
          className="w-full"
          disabled={isSubmitting}
        >
          <Mail className="h-4 w-4 mr-2" />
          Google
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleSocialLogin('apple')} 
          className="w-full"
          disabled={isSubmitting}
        >
          <Apple className="h-4 w-4 mr-2" />
          Apple
        </Button>
      </div>
    </>
  );
};

export default SocialLoginButtons;
