import { useEffect } from 'react';
import { getSetting } from '@/utils/adminSettingsManager';

const useDocumentTitle = () => {
  useEffect(() => {
    const updateDocumentTitle = () => {
      try {
        const siteTitle = getSetting('siteTitle');
        document.title = siteTitle || "BLOTIC";
      } catch (error) {
        console.error("Failed to update document title:", error);
        document.title = "BLOTIC";
      }
    };

    // Update title on mount
    updateDocumentTitle();

    // Listen for storage changes to update title when settings change
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "adminSettings") {
        updateDocumentTitle();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events when settings are updated in the same tab
    const handleSettingsUpdate = () => {
      updateDocumentTitle();
    };

    window.addEventListener('adminSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminSettingsUpdated', handleSettingsUpdate);
    };
  }, []);
};

export default useDocumentTitle;
