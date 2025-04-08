
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="bg-shareai-blue text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2" onClick={() => navigate("/")} role="button">
          <div className="flex items-center">
            <Home className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">Share.AI</span>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="block lg:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-shareai-blue/20"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        
        {/* Desktop menu */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-shareai-blue/20"
            onClick={() => navigate("/")}
          >
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-shareai-blue/20"
            onClick={() => navigate("/properties")}
          >
            Properties
          </Button>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-shareai-blue/20"
            onClick={() => navigate("/reports")}
          >
            Reports
          </Button>
        </nav>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-shareai-blue border-t border-white/10 py-2">
          <div className="container mx-auto px-4 flex flex-col space-y-2">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-shareai-blue/20 justify-start"
              onClick={() => {
                navigate("/");
                setMenuOpen(false);
              }}
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-shareai-blue/20 justify-start"
              onClick={() => {
                navigate("/properties");
                setMenuOpen(false);
              }}
            >
              Properties
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-shareai-blue/20 justify-start"
              onClick={() => {
                navigate("/reports");
                setMenuOpen(false);
              }}
            >
              Reports
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
