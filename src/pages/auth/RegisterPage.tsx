
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Apple, Facebook } from "lucide-react";
import { Provider } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import PasswordMatchIndicator from "@/components/auth/PasswordMatchIndicator";
import SimpleCaptcha from "@/components/auth/SimpleCaptcha";
import { calculatePasswordStrength } from "@/utils/passwordUtils";

const RegisterPage = () => {
  const { register, socialLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && !authLoading) {
    navigate("/dashboard", { replace: true });
    return null;
  }
  
  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return false;
    }
    
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    if (!password) {
      setError("Please enter a password.");
      return false;
    }
    
    // Validate password strength
    const passwordStrength = calculatePasswordStrength(password);
    if (passwordStrength.score < 2) {
      setError("Please choose a stronger password. Use at least 8 characters with a mix of letters, numbers, and symbols.");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    setError(null);
    try {
      await socialLogin(provider);
      // Redirect will be handled by the OAuth flow
    } catch (error: any) {
      setError(error.message || `Registration with ${provider} failed.`);
    }
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <img 
                src="/lovable-uploads/995debfe-a235-4aaf-a9c8-0681858a1a57.png" 
                alt="VerifyVision AI Logo" 
                className="h-16 w-20 cursor-pointer" 
              />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <PasswordStrengthIndicator password={password} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <PasswordMatchIndicator 
                password={password} 
                confirmPassword={confirmPassword} 
              />
            </div>

            <SimpleCaptcha onVerify={setIsCaptchaVerified} />

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

            <div className="grid grid-cols-3 gap-3">
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('facebook')} 
                className="w-full"
                disabled={isSubmitting}
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-verifyvision-gradient-start via-verifyvision-gradient-middle to-verifyvision-gradient-end hover:opacity-90"
              disabled={isSubmitting || !isCaptchaVerified}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-verifyvision-primary hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
