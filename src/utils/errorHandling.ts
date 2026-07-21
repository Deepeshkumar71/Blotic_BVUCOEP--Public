// Utility functions for error handling and timeout management

export const createTimeoutPromise = <T>(
  promise: Promise<T>,
  timeoutMs: number = 300000 // 5 minutes default
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    // Handle specific Supabase errors
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.includes('unauthorized')) {
      return 'You are not authorized to perform this action. Please log in again.';
    }
    if (error.message.includes('duplicate')) {
      return 'This information already exists. Please use different values.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const isNetworkError = (error: any): boolean => {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('fetch') ||
    error?.code === 'NETWORK_ERROR' ||
    error?.name === 'NetworkError'
  );
};
