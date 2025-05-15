
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Apple, Facebook, X } from "lucide-react";
import { Provider } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

const LoginPage = () => {
  const { login, socialLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  
  // Get the page they were trying to visit
  const from = location.state?.from?.pathname || "/";
  
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
    
    // Validate CSRF token
    const storedToken = sessionStorage.getItem("authCsrfToken");
    if (csrfToken !== storedToken) {
      setError("Security validation failed. Please refresh the page and try again.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    // Add a small delay for brute force protection (not easily detectable)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Generate a new CSRF token after successful login
      const newToken = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("authCsrfToken", newToken);
      
      // Redirect to original destination or home
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please check your credentials.";
      
      // Don't expose specific authentication errors
      setError("Invalid email or password. Please try again.");
      
      // Log the actual error for debugging
      console.error("Authentication error:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    try {
      setError(null);
      
      // Store the current URL to check after redirect (prevent open redirects)
      sessionStorage.setItem("preAuthPath", window.location.pathname);
      
      await socialLogin(provider);
      // No need for navigate or toast here as the redirect will happen automatically
    } catch (error: any) {
      const errorMessage = error.message || `Login with ${provider} failed.`;
      
      // Check for the specific validation error
      if (errorMessage.includes('provider is not enabled')) {
        setError(`The ${provider} login provider is not enabled in your Supabase project settings.`);
      } else {
        setError(errorMessage);
      }
    }
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email to sign in to your account
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/reset-password" 
                  className="text-sm text-shareai-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
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
                  <ProgressIndicator variant="inline" size="sm" className="mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-shareai-teal hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
