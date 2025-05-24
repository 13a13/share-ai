
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface EmailVerificationPromptProps {
  email: string;
  onClose?: () => void;
}

const EmailVerificationPrompt = ({ email, onClose }: EmailVerificationPromptProps) => {
  const [isResending, setIsResending] = useState(false);
  const { resendVerification } = useAuth();
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerification(email);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend email",
        description: "Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-16 w-16 text-verifyvision-teal" />
        </div>
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We've sent a verification link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Click the link in the email to verify your account. If you don't see the email, check your spam folder.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
          
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Back to login
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerificationPrompt;
