
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated && !authLoading) {
    navigate("/dashboard", { replace: true });
    return null;
  }
  
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
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-center">
            <p>Login form will be implemented here</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-verifyvision-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
