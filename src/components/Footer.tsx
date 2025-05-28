
import { Github, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto bg-brand-blue-950 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            <img 
              src="/lovable-uploads/995debfe-a235-4aaf-a9c8-0681858a1a57.png" 
              alt="VerifyVision AI Logo" 
              className="h-10 w-15 mr-3" 
            />
            <div>
              <h3 className="text-xl font-bold mb-2 text-white">VerifyVision AI</h3>
              <p className="text-brand-blue-300">
                AI-powered property inspection reports
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center space-x-4 mb-2">
              <a 
                href="#" 
                className="text-white hover:text-verifyvision-teal transition-colors duration-300"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <span className="flex items-center text-sm text-white">
                Made with <Heart className="h-4 w-4 text-verifyvision-teal mx-1" /> by VerifyVision AI Team
              </span>
            </div>
            <p className="text-sm text-brand-blue-300">
              &copy; {new Date().getFullYear()} VerifyVision AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
