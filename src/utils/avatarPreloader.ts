/**
 * Avatar preloader utility to improve profile photo loading performance
 */

// Cache for preloaded images
const imageCache = new Map<string, boolean>();

/**
 * Preload an avatar image to improve loading performance
 */
export const preloadAvatar = (avatarUrl: string | null | undefined): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!avatarUrl) {
      resolve(false);
      return;
    }

    // Check if already cached
    if (imageCache.has(avatarUrl)) {
      resolve(imageCache.get(avatarUrl) || false);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      console.log('✅ Avatar preloaded successfully:', avatarUrl);
      imageCache.set(avatarUrl, true);
      resolve(true);
    };
    
    img.onerror = () => {
      console.warn('⚠️ Avatar preload failed:', avatarUrl);
      imageCache.set(avatarUrl, false);
      resolve(false);
    };
    
    // Set a timeout to avoid hanging
    setTimeout(() => {
      console.warn('⏰ Avatar preload timeout:', avatarUrl);
      imageCache.set(avatarUrl, false);
      resolve(false);
    }, 2000);
    
    img.src = avatarUrl;
  });
};

/**
 * Check if an avatar is already cached
 */
export const isAvatarCached = (avatarUrl: string | null | undefined): boolean => {
  if (!avatarUrl) return false;
  return imageCache.has(avatarUrl) && imageCache.get(avatarUrl) === true;
};

/**
 * Clear the avatar cache
 */
export const clearAvatarCache = (): void => {
  imageCache.clear();
  console.log('🧹 Avatar cache cleared');
};
