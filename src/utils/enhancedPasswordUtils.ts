
import { calculatePasswordStrength } from './passwordUtils';

interface PasswordSecurityCheck {
  isSecure: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  estimatedCrackTime: string;
}

// Common breached passwords (truncated list for demo)
const COMMON_BREACHED_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'iloveyou', '123123', 'sunshine', 'princess', 'football', 'charlie',
  'aa123456', 'qwerty123', 'dragon', 'master', 'solo', 'hello'
]);

const KEYBOARD_PATTERNS = [
  'qwerty', 'asdf', 'zxcv', '123456', '098765', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', '1234567890', '0987654321'
];

const COMMON_SUBSTITUTIONS = {
  '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't', '4': 'a'
};

export class EnhancedPasswordSecurity {
  private static normalizePassword(password: string): string {
    let normalized = password.toLowerCase();
    
    // Reverse common substitutions
    for (const [symbol, letter] of Object.entries(COMMON_SUBSTITUTIONS)) {
      normalized = normalized.replace(new RegExp(symbol, 'g'), letter);
    }
    
    return normalized;
  }

  private static checkCommonPatterns(password: string): string[] {
    const issues: string[] = [];
    const normalized = this.normalizePassword(password);
    
    // Check for keyboard patterns
    for (const pattern of KEYBOARD_PATTERNS) {
      if (normalized.includes(pattern) || normalized.includes(pattern.split('').reverse().join(''))) {
        issues.push('Contains keyboard patterns');
        break;
      }
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Contains repeated characters');
    }
    
    // Check for sequential numbers
    if (/(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
      issues.push('Contains sequential numbers');
    }
    
    // Check for common words/dates
    if (/\d{4}/.test(password)) {
      const year = parseInt(password.match(/\d{4}/)?.[0] || '0');
      if (year >= 1900 && year <= new Date().getFullYear() + 10) {
        issues.push('Contains what appears to be a year');
      }
    }
    
    return issues;
  }

  private static estimateCrackTime(password: string): string {
    const charset = {
      lowercase: /[a-z]/.test(password) ? 26 : 0,
      uppercase: /[A-Z]/.test(password) ? 26 : 0,
      numbers: /\d/.test(password) ? 10 : 0,
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 32 : 0
    };
    
    const totalCharset = Object.values(charset).reduce((sum, count) => sum + count, 0);
    const combinations = Math.pow(totalCharset, password.length);
    
    // Assume 1 billion guesses per second (modern GPU)
    const secondsToHalfCrack = combinations / (2 * 1_000_000_000);
    
    if (secondsToHalfCrack < 1) return 'Instantly';
    if (secondsToHalfCrack < 60) return `${Math.round(secondsToHalfCrack)} seconds`;
    if (secondsToHalfCrack < 3600) return `${Math.round(secondsToHalfCrack / 60)} minutes`;
    if (secondsToHalfCrack < 86400) return `${Math.round(secondsToHalfCrack / 3600)} hours`;
    if (secondsToHalfCrack < 31536000) return `${Math.round(secondsToHalfCrack / 86400)} days`;
    if (secondsToHalfCrack < 31536000000) return `${Math.round(secondsToHalfCrack / 31536000)} years`;
    
    return 'Centuries';
  }

  public static checkPasswordSecurity(password: string): PasswordSecurityCheck {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Get basic strength
    const basicStrength = calculatePasswordStrength(password);
    
    // Check against breached passwords
    const normalized = this.normalizePassword(password);
    if (COMMON_BREACHED_PASSWORDS.has(normalized)) {
      issues.push('Password found in data breaches');
      suggestions.push('Use a completely different password');
    }
    
    // Check for common patterns
    const patternIssues = this.checkCommonPatterns(password);
    issues.push(...patternIssues);
    
    // Additional checks
    if (password.length < 12) {
      issues.push('Password is too short');
      suggestions.push('Use at least 12 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      suggestions.push('Add lowercase letters');
    }
    
    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add uppercase letters');
    }
    
    if (!/\d/.test(password)) {
      suggestions.push('Add numbers');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Add special characters');
    }
    
    // Calculate final score
    let score = basicStrength.score;
    
    // Penalties
    if (issues.length > 0) score = Math.max(0, score - issues.length);
    if (COMMON_BREACHED_PASSWORDS.has(normalized)) score = 0;
    
    // Bonuses
    if (password.length >= 16) score = Math.min(4, score + 1);
    if (password.length >= 20) score = Math.min(4, score + 1);
    
    const estimatedCrackTime = this.estimateCrackTime(password);
    
    return {
      isSecure: score >= 3 && issues.length === 0,
      score,
      issues,
      suggestions,
      estimatedCrackTime
    };
  }

  public static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
