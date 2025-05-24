
import { calculatePasswordStrength } from "@/utils/passwordUtils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            strength.score === 0 ? 'bg-red-500' :
            strength.score === 1 ? 'bg-orange-500' :
            strength.score === 2 ? 'bg-yellow-500' :
            strength.score === 3 ? 'bg-green-500' :
            'bg-green-600'
          }`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <div className={strength.requirements.length ? 'text-green-600' : 'text-gray-400'}>
            ✓ At least 8 characters
          </div>
          <div className={strength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'}>
            ✓ Uppercase letter
          </div>
          <div className={strength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'}>
            ✓ Lowercase letter
          </div>
          <div className={strength.requirements.number ? 'text-green-600' : 'text-gray-400'}>
            ✓ Number
          </div>
          <div className={strength.requirements.special ? 'text-green-600' : 'text-gray-400'}>
            ✓ Special character
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
