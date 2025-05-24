
import { CheckCircle, XCircle } from "lucide-react";
import { getPasswordMatchStatus } from "@/utils/passwordUtils";

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

const PasswordMatchIndicator = ({ password, confirmPassword }: PasswordMatchIndicatorProps) => {
  const matchStatus = getPasswordMatchStatus(password, confirmPassword);

  if (matchStatus.matches === null) return null;

  return (
    <div className="mt-2 flex items-center space-x-2">
      {matchStatus.matches ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${matchStatus.color}`}>
        {matchStatus.message}
      </span>
    </div>
  );
};

export default PasswordMatchIndicator;
