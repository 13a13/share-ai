
import { useAuth } from "@/contexts/AuthContext";
import EmailVerificationPrompt from "./EmailVerificationPrompt";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const EmailVerificationGuard = ({ children, fallback }: EmailVerificationGuardProps) => {
  const { user } = useAuth();

  if (user && !user.emailConfirmed) {
    return fallback || (
      <div className="container flex items-center justify-center min-h-screen py-8">
        <EmailVerificationPrompt email={user.email} />
      </div>
    );
  }

  return <>{children}</>;
};

export default EmailVerificationGuard;
