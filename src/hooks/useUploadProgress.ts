import { useState, useCallback } from 'react';
import { UploadItem } from '@/components/ui/upload-progress-dialog';

export const useUploadProgress = () => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addUpload = useCallback((file: File): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newUpload: UploadItem = {
      id,
      name: file.name,
      progress: 0,
      status: 'uploading',
      size: file.size,
    };

    setUploads(prev => [...prev, newUpload]);
    setIsVisible(true);
    return id;
  }, []);

  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed' && upload.status !== 'error'
    ));
  }, []);

  const clearAll = useCallback(() => {
    setUploads([]);
    setIsVisible(false);
  }, []);

  const hideDialog = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showDialog = useCallback(() => {
    if (uploads.length > 0) {
      setIsVisible(true);
    }
  }, [uploads.length]);

  // Auto-hide dialog after all uploads are completed (with delay)
  const autoHideCompleted = useCallback(() => {
    const allCompleted = uploads.length > 0 && uploads.every(upload => 
      upload.status === 'completed' || upload.status === 'error'
    );
    
    const hasSuccessfulUploads = uploads.some(upload => upload.status === 'completed');
    const hasOnlyErrors = uploads.length > 0 && uploads.every(upload => upload.status === 'error');
    
    if (allCompleted) {
      setTimeout(() => {
        setIsVisible(false);
        // Clear completed/error uploads after auto-hide
        setUploads(prev => prev.filter(upload => 
          upload.status !== 'completed' && upload.status !== 'error'
        ));
      }, 6000); // Hide after 6 seconds for all scenarios
    }
  }, [uploads]);

  return {
    uploads,
    isVisible,
    addUpload,
    updateUpload,
    removeUpload,
    clearCompleted,
    clearAll,
    hideDialog,
    showDialog,
    autoHideCompleted,
  };
};
