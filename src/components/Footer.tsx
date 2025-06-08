
const Footer = () => {
  return (
    <footer className="bg-brand-blue-950 text-white py-8 mt-auto">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img 
              src="/lovable-uploads/995debfe-a235-4aaf-a9c8-0681858a1a57.png" 
              alt="VerifyVision AI Logo" 
              className="h-8 w-10" 
            />
            <span className="text-lg font-bold">VerifyVision AI</span>
          </div>
          <p className="text-sm text-white">
            &copy; {new Date().getFullYear()} VerifyVision AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
