
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Apple, Facebook, Loader2 } from "lucide-react";
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
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  
  // Get the page they were trying to visit
  const from = location.state?.from?.pathname || "/";
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      console.log("Initiating Google login");
      await socialLogin('google');
      // The redirect will happen automatically through Supabase
    } catch (error: any) {
      console.error("Google login error:", error);
      setGoogleLoading(false);
      setError(error.message || "Login with Google failed.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setError(null);
      setFacebookLoading(true);
      console.log("Initiating Facebook login");
      await socialLogin('facebook');
      // The redirect will happen automatically through Supabase
    } catch (error: any) {
      console.error("Facebook login error:", error);
      setFacebookLoading(false);
      setError(error.message || "Login with Facebook failed.");
    }
  };

  const handleAppleLogin = async () => {
    try {
      setError(null);
      setAppleLoading(true);
      console.log("Initiating Apple Sign-In");
      await socialLogin('apple');
      // The redirect happens automatically through Supabase
    } catch (error: any) {
      console.error("Apple Sign-In error:", error);
      setAppleLoading(false);
      setError(error.message || "Apple Sign-In failed.");
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    if (provider === 'apple') {
      return handleAppleLogin();
    } else if (provider === 'google') {
      return handleGoogleLogin();
    } else if (provider === 'facebook') {
      return handleFacebookLogin();
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
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ProgressIndicator variant="inline" size="sm" className="mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('apple')} 
                className="w-full"
                disabled={appleLoading}
              >
                {appleLoading ? (
                  <ProgressIndicator variant="inline" size="sm" className="mr-2" />
                ) : (
                  <Apple className="h-4 w-4 mr-2" />
                )}
                Apple
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('facebook')} 
                className="w-full"
                disabled={facebookLoading}
              >
                {facebookLoading ? (
                  <ProgressIndicator variant="inline" size="sm" className="mr-2" />
                ) : (
                  <Facebook className="h-4 w-4 mr-2" />
                )}
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
