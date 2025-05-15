
import { z } from 'zod';

/**
 * Password strength schema using Zod
 * Enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .refine(
    password => /[A-Z]/.test(password),
    { message: "Password must include at least one uppercase letter" }
  )
  .refine(
    password => /[a-z]/.test(password),
    { message: "Password must include at least one lowercase letter" }
  )
  .refine(
    password => /[0-9]/.test(password),
    { message: "Password must include at least one number" }
  )
  .refine(
    password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    { message: "Password must include at least one special character (!@#$%^&*(),.?\":{}|<>)" }
  );

/**
 * Validate a password against security requirements
 * @param password The password to validate
 * @returns Object containing validation result and error messages
 */
export const validatePassword = (password: string) => {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  
  return {
    isValid: false,
    errors: result.error.errors.map(error => error.message)
  };
};

/**
 * Calculate password strength score (0-100)
 * @param password The password to evaluate
 * @returns Number from 0-100 representing password strength
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length contribution (up to 25 points)
  score += Math.min(25, password.length * 2);
  
  // Character variety contribution
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15; // Special chars
  
  // Pattern variety (up to 30 points)
  const uniqueChars = new Set(password.split('')).size;
  score += Math.min(30, uniqueChars * 3);
  
  // Cap at 100
  return Math.min(100, score);
};
