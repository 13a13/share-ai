
import { useState, useEffect } from "react";
import { EnhancedPasswordSecurity } from "@/utils/enhancedPasswordUtils";
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedPasswordStrengthIndicatorProps {
  password: string;
  onSecurityChange?: (isSecure: boolean) => void;
}

const EnhancedPasswordStrengthIndicator = ({ 
  password, 
  onSecurityChange 
}: EnhancedPasswordStrengthIndicatorProps) => {
  const [security, setSecurity] = useState(EnhancedPasswordSecurity.checkPasswordSecurity(''));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const result = EnhancedPasswordSecurity.checkPasswordSecurity(password);
    setSecurity(result);
    onSecurityChange?.(result.isSecure);
  }, [password, onSecurityChange]);

  if (!password) return null;

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0: return 'text-red-600 bg-red-50 border-red-200';
      case 1: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 2: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 3: return 'text-blue-600 bg-blue-50 border-blue-200';
      case 4: return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Strong';
      case 4: return 'Very Strong';
      default: return 'Unknown';
    }
  };

  const getScoreIcon = (score: number) => {
    if (score <= 1) return <XCircle className="h-4 w-4" />;
    if (score <= 2) return <AlertTriangle className="h-4 w-4" />;
    if (score <= 3) return <Shield className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getScoreColor(security.score)}`}>
            {getScoreIcon(security.score)}
            <span>{getScoreLabel(security.score)}</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              security.score === 0 ? 'bg-red-500' :
              security.score === 1 ? 'bg-orange-500' :
              security.score === 2 ? 'bg-yellow-500' :
              security.score === 3 ? 'bg-blue-500' :
              'bg-green-500'
            }`}
            style={{ width: `${(security.score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Crack Time Estimate */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Estimated crack time:</span>
        <span className="font-medium">{security.estimatedCrackTime}</span>
      </div>

      {/* Issues and Suggestions */}
      {(security.issues.length > 0 || security.suggestions.length > 0) && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-xs"
          >
            {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </Button>

          {showDetails && (
            <div className="space-y-2">
              {security.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <h4 className="text-xs font-medium text-red-800 mb-1">Security Issues:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {security.issues.map((issue, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <XCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {security.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                  <h4 className="text-xs font-medium text-blue-800 mb-1">Suggestions:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {security.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Security Status */}
      {security.isSecure && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Password meets security requirements</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedPasswordStrengthIndicator;
