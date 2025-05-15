
import React from 'react';
import { calculatePasswordStrength } from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  
  // Determine the color based on strength
  const getColor = () => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  // Determine the label based on strength
  const getLabel = () => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };
  
  // Don't show anything if password is empty
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all ease-out duration-300`} 
          style={{ width: `${strength}%` }} 
        />
      </div>
      <p className={`text-xs mt-1 ${getColor().replace('bg-', 'text-')}`}>
        Password Strength: {getLabel()}
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;
