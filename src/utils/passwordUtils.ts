
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  let score = 0;
  let label = 'Very Weak';
  let color = 'text-red-500';

  if (metRequirements >= 5) {
    score = 4;
    label = 'Very Strong';
    color = 'text-green-600';
  } else if (metRequirements >= 4) {
    score = 3;
    label = 'Strong';
    color = 'text-green-500';
  } else if (metRequirements >= 3) {
    score = 2;
    label = 'Medium';
    color = 'text-yellow-500';
  } else if (metRequirements >= 2) {
    score = 1;
    label = 'Weak';
    color = 'text-orange-500';
  }

  return { score, label, color, requirements };
};

export const getPasswordMatchStatus = (password: string, confirmPassword: string) => {
  if (!confirmPassword) return { matches: null, message: '', color: '' };
  
  const matches = password === confirmPassword;
  return {
    matches,
    message: matches ? 'Passwords match' : 'Passwords do not match',
    color: matches ? 'text-green-600' : 'text-red-500'
  };
};
