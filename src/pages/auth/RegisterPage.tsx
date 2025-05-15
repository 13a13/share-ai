
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Apple, Facebook, Loader2 } from "lucide-react";
import { Provider } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { validatePassword } from "@/utils/passwordValidation";

const RegisterPage = () => {
  const { register, socialLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Generate CSRF token on mount
  useEffect(() => {
    // Generate random CSRF token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    setCsrfToken(token);
    
    // Store in session storage
    sessionStorage.setItem("authCsrfToken", token);
    
    // Check for HTTP protocol and redirect to HTTPS if needed
    if (window.location.protocol === "http:" && 
        window.location.hostname !== "localhost" && 
        !window.location.hostname.includes("127.0.0.1")) {
      window.location.href = window.location.href.replace("http:", "https:");
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate CSRF token
    const storedToken = sessionStorage.getItem("authCsrfToken");
    if (csrfToken !== storedToken) {
      setError("Security validation failed. Please refresh the page and try again.");
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordErrors(passwordValidation.errors);
      setError("Please fix the password issues before continuing.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please make sure both passwords match.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Add a small delay for brute force protection (not easily detectable)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    try {
      await register(email, password, name);
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      
      // Generate a new CSRF token after successful registration
      const newToken = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("authCsrfToken", newToken);
      
      navigate("/");
    } catch (error: any) {
      // Don't expose specific details about registration failures
      if (error.message?.includes("already registered")) {
        setError("This email address is already registered. Please try logging in instead.");
      } else {
        setError("Registration failed. Please check your information and try again.");
        console.error("Registration error:", error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    try {
      // Store the current URL to check after redirect (prevent open redirects)
      sessionStorage.setItem("preAuthPath", window.location.pathname);
      
      await socialLogin(provider);
    } catch (error: any) {
      if (error.message?.includes("provider is not enabled")) {
        setError(`The ${provider} login provider is not enabled in your Supabase project settings.`);
      } else {
        setError(error.message || `Registration with ${provider} failed.`);
      }
    }
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="csrfToken" value={csrfToken} />
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
                autoComplete="name"
                required
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
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear password errors when user types
                  if (passwordErrors.length > 0) {
                    setPasswordErrors([]);
                  }
                }}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <PasswordStrengthIndicator password={password} />
              {passwordErrors.length > 0 && (
                <ul className="text-xs text-red-500 mt-1 list-disc pl-4">
                  {passwordErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              {password !== confirmPassword && confirmPassword.length > 0 && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

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
              >
                <Mail className="h-4 w-4 mr-2" />
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('apple')} 
                className="w-full"
              >
                <Apple className="h-4 w-4 mr-2" />
                Apple
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('facebook')} 
                className="w-full"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-shareai-teal hover:bg-shareai-teal/90"
              disabled={isSubmitting}
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
              <Link to="/login" className="font-medium text-shareai-teal hover:underline">
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
