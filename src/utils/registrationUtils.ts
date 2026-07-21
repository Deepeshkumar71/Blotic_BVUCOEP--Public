// Registration utility functions

/**
 * Logs a registration attempt to the backend for analytics and debugging
 */
export const logRegistrationAttempt = async (
  email: string,
  fullName?: string,
  phone?: string,
  branch?: string,
  year?: number,
  success: boolean = false,
  errorMessage?: string,
  autoSigninAttempted: boolean = false,
  autoSigninSuccess: boolean = false
) => {
  try {
    // Try to log via API endpoint (if backend is available)
    const response = await fetch('/api/log-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fullName,
        phone,
        branch,
        year,
        success,
        errorMessage,
        autoSigninAttempted,
        autoSigninSuccess,
        userAgent: navigator.userAgent,
      }),
    });

    if (response.ok) {
      console.log('✅ Registration attempt logged successfully');
    } else {
      console.warn('⚠️ Failed to log registration attempt via API');
    }
  } catch (error) {
    // Silently fail if logging doesn't work - don't block registration
    console.warn('⚠️ Registration logging failed:', error);
  }
};

/**
 * Validates registration data before submission
 */
export const validateRegistrationData = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  branch: string;
  year: string;
}) => {
  const errors: Record<string, string> = {};

  // Name validation
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (formData.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  const phoneRegex = /^\d{10}$/;
  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
    errors.phone = 'Phone number must be exactly 10 digits';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // Branch validation
  if (!formData.branch) {
    errors.branch = 'Please select a branch';
  }

  // Year validation
  if (!formData.year) {
    errors.year = 'Please select an academic year';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Formats user data for registration
 */
export const formatRegistrationData = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  branch: string;
  year: string;
}) => {
  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    additionalData: {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
      branch: formData.branch,
      year: parseInt(formData.year) || null,
    },
  };
};
