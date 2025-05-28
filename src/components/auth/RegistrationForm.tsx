
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordMatchIndicator from "@/components/auth/PasswordMatchIndicator";
import SimpleCaptcha from "@/components/auth/SimpleCaptcha";
import EnhancedPasswordStrengthIndicator from "@/components/auth/EnhancedPasswordStrengthIndicator";
import { EnhancedPasswordSecurity } from "@/utils/enhancedPasswordUtils";
import { securityService } from "@/lib/security/securityService";
import SocialLoginButtons from "./SocialLoginButtons";

const RegistrationForm = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  
  const validateForm = () => {
    // Sanitize inputs
    const sanitizedName = securityService.sanitizeInput(name);
    const sanitizedEmail = securityService.sanitizeInput(email);
    
    if (!sanitizedName.trim()) {
      setError("Please enter your name.");
      return false;
    }
    
    if (!sanitizedEmail.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    // Validate email with enhanced security
    const emailValidation = securityService.validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.reason || "Please enter a valid email address.");
      return false;
    }
    
    if (!password) {
      setError("Please enter a password.");
      return false;
    }
    
    // Enhanced password validation
    const passwordSecurity = EnhancedPasswordSecurity.checkPasswordSecurity(password);
    if (!passwordSecurity.isSecure) {
      if (passwordSecurity.issues.length > 0) {
        setError(`Password security issue: ${passwordSecurity.issues[0]}`);
      } else {
        setError("Please choose a stronger password. Use at least 12 characters with a mix of letters, numbers, and symbols.");
      }
      return false;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please make sure both passwords match.");
      return false;
    }
    
    if (!isCaptchaVerified) {
      setError("Please complete the security check.");
      return false;
    }

    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    // Check rate limiting before attempting registration
    const rateLimitCheck = securityService.checkRateLimit('register', email);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.reason || "Too many registration attempts");
      setRemainingAttempts(rateLimitCheck.remainingAttempts || 0);
      return;
    }

    setRemainingAttempts(rateLimitCheck.remainingAttempts || null);
    setIsSubmitting(true);
    
    try {
      console.log("Attempting to register user:", email.trim());
      await register(email.trim(), password, name.trim());
      
      console.log("Registration completed successfully");
      
      // Wait a moment for auth state to update, then navigate
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
      
      // Update remaining attempts after failed registration
      const updatedCheck = securityService.checkRateLimit('register', email);
      setRemainingAttempts(updatedCheck.remainingAttempts || 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <div className="mt-1 text-sm">
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
          maxLength={100}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
          maxLength={254}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={12}
          disabled={isSubmitting}
        />
        <EnhancedPasswordStrengthIndicator 
          password={password} 
          onSecurityChange={setIsPasswordSecure}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={12}
          disabled={isSubmitting}
        />
        <PasswordMatchIndicator 
          password={password} 
          confirmPassword={confirmPassword} 
        />
      </div>

      <SimpleCaptcha onVerify={setIsCaptchaVerified} />

      <SocialLoginButtons onError={setError} isSubmitting={isSubmitting} />

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-verifyvision-gradient-start via-verifyvision-gradient-middle to-verifyvision-gradient-end hover:opacity-90"
        disabled={isSubmitting || !isCaptchaVerified || !isPasswordSecure}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
};

export default RegistrationForm;
