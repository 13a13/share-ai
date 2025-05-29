
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown, Home } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };
  
  return (
    <header className="bg-brand-blue-950 py-4 text-white">
      <div className="verifyvision-container flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex items-center">
              <img 
                src="/lovable-uploads/995debfe-a235-4aaf-a9c8-0681858a1a57.png" 
                alt="VerifyVision AI Logo" 
                className="h-10 w-15"
              />
              <span className="text-xl font-bold ml-2 text-white">VerifyVision AI</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/995debfe-a235-4aaf-a9c8-0681858a1a57.png" 
                alt="VerifyVision AI Logo" 
                className="h-10 w-15"
              />
              <span className="text-xl font-bold ml-2 text-white">VerifyVision AI</span>
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-verifyvision-teal hover:text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  <span className="mr-1">{user?.name || user?.email?.split('@')[0]}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white z-50">
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-verifyvision-teal hover:text-white"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  <span>Home</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-verifyvision-teal hover:text-white"
                  onClick={() => navigate("/profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-verifyvision-teal hover:text-white focus:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-verifyvision-teal hover:text-white">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-verifyvision-teal hover:bg-verifyvision-teal/90 text-white">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
