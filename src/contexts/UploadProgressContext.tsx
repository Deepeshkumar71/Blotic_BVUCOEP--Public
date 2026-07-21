import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { UploadProgressDialog, UploadItem } from '@/components/ui/upload-progress-dialog';

interface UploadProgressContextType {
  addUpload: (file: File) => string;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  hideDialog: () => void;
  showDialog: () => void;
  autoHideCompleted: () => void;
  uploads: UploadItem[];
  isVisible: boolean;
}

const UploadProgressContext = createContext<UploadProgressContextType | undefined>(undefined);

export const useUploadProgressContext = () => {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error('useUploadProgressContext must be used within an UploadProgressProvider');
  }
  return context;
};

interface UploadProgressProviderProps {
  children: ReactNode;
}

export const UploadProgressProvider: React.FC<UploadProgressProviderProps> = ({ children }) => {
  const uploadProgress = useUploadProgress();

  // Auto-hide completed uploads
  useEffect(() => {
    uploadProgress.autoHideCompleted();
  }, [uploadProgress]);

  const handleCancel = (id: string) => {
    uploadProgress.updateUpload(id, { status: 'error', error: 'Upload cancelled' });
    // You can add actual upload cancellation logic here
  };

  const handleClose = () => {
    // Clear completed uploads when dialog is closed
    uploadProgress.clearCompleted();
    uploadProgress.hideDialog();
  };

  return (
    <UploadProgressContext.Provider value={uploadProgress}>
      {children}
      <UploadProgressDialog
        uploads={uploadProgress.uploads}
        isVisible={uploadProgress.isVisible}
        onClose={handleClose}
        onCancel={handleCancel}
      />
    </UploadProgressContext.Provider>
  );
};
