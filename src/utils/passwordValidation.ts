import { getMinPasswordLength as getMinLength } from './adminSettingsManager';

/**
 * Get the minimum password length from admin settings
 * @returns Minimum password length (defaults to 6 if not set)
 */
export const getMinPasswordLength = (): number => {
  return getMinLength();
};

/**
 * Validate password against minimum length requirement
 * @param password - Password to validate
 * @returns Object with isValid flag and error message
 */
export const validatePasswordLength = (password: string): { isValid: boolean; message: string } => {
  const minLength = getMinPasswordLength();
  
  if (!password || password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
};
