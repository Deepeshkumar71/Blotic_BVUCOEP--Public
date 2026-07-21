import React from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'converting' | 'completed' | 'error';
  error?: string;
  size?: number;
}

interface UploadProgressDialogProps {
  uploads: UploadItem[];
  isVisible: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusIcon = (status: UploadItem['status']) => {
  switch (status) {
    case 'uploading':
      return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
    case 'converting':
      return <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <FileImage className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusText = (status: UploadItem['status'], progress: number) => {
  switch (status) {
    case 'uploading':
      return `Uploading... ${progress}%`;
    case 'converting':
      return 'Processing...';
    case 'completed':
      return 'Upload complete';
    case 'error':
      return 'Upload failed';
    default:
      return 'Preparing...';
  }
};

const getProgressColor = (status: UploadItem['status']) => {
  switch (status) {
    case 'uploading':
      return 'bg-blue-500';
    case 'converting':
      return 'bg-orange-500';
    case 'completed':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const UploadProgressDialog: React.FC<UploadProgressDialogProps> = ({
  uploads,
  isVisible,
  onClose,
  onCancel,
}) => {
  if (!isVisible || uploads.length === 0) return null;

  const activeUploads = uploads.filter(upload => upload.status !== 'completed');
  const completedCount = uploads.filter(upload => upload.status === 'completed').length;
  const totalCount = uploads.length;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-black border border-gray-600 rounded-lg shadow-2xl">
      {/* Header - Only show when uploads are in progress */}
      {!(completedCount === totalCount && totalCount > 0) && (
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <Upload className={`w-4 h-4 text-blue-400 ${activeUploads.length > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-white">
              {activeUploads.length > 0 
                ? `Uploading... ${completedCount} of ${totalCount} uploaded`
                : `${completedCount} of ${totalCount} uploads complete`
              }
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}


      {/* Upload Items - Only show when uploads are in progress */}
      {!(completedCount === totalCount && totalCount > 0) && (
        <div className="max-h-64 overflow-y-auto">
          {uploads.map((upload) => (
            <div key={upload.id} className="p-3 border-b border-gray-600 last:border-b-0">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(upload.status)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate text-white" title={upload.name}>
                      {upload.name}
                    </p>
                    {upload.status !== 'completed' && upload.status !== 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(upload.id)}
                        className="h-5 w-5 p-0 hover:bg-gray-700 text-gray-400 hover:text-white ml-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {upload.status !== 'completed' && upload.status !== 'error' && (
                    <div className="mb-1">
                      <Progress 
                        value={upload.progress} 
                        className="h-1.5"
                      />
                    </div>
                  )}

                  {/* Status Text */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className={upload.status === 'error' ? 'text-red-400' : 'text-gray-300'}>
                      {upload.status === 'error' && upload.error 
                        ? upload.error 
                        : getStatusText(upload.status, upload.progress)
                      }
                    </span>
                    {upload.size && (
                      <span className="text-gray-400">{formatFileSize(upload.size)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success/Error Footer */}
      {completedCount === totalCount && totalCount > 0 && (() => {
        const errorCount = uploads.filter(upload => upload.status === 'error').length;
        const successCount = uploads.filter(upload => upload.status === 'completed').length;
        const allErrors = errorCount === totalCount;
        
        return (
          <div className={`relative rounded-b-lg ${allErrors ? 'bg-gradient-to-br from-red-900/90 to-red-950/90 border-t border-red-500/30' : 'bg-gradient-to-br from-green-900/90 via-emerald-900/90 to-green-950/90 border-t border-green-500/30'}`}>
            {/* Close Button - Top Right */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>

            {allErrors ? (
              <div className="text-center p-4">
                <div className="flex justify-center mb-2">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="text-sm font-medium text-red-300 mb-1">
                  All uploads failed
                </div>
                <div className="text-xs text-red-400/80">
                  Check the errors above and try again
                </div>
              </div>
            ) : (
              <div className="text-center py-4 px-3">
                {/* Compact Success Animation */}
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    {/* Bright Green Success Circle */}
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    {/* Glowing Ring */}
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-green-400 animate-ping opacity-30"></div>
                  </div>
                </div>

                {/* Compact Title */}
                <h3 className="text-base font-bold text-green-400 mb-2">
                  Upload Complete! ✨
                </h3>

                {/* Compact Message */}
                <p className="text-green-300/90 text-sm font-medium">
                  {successCount === 1 
                    ? `1 photo uploaded` 
                    : `${successCount} photos uploaded`
                  }
                </p>
                <p className="text-green-400/60 text-xs mt-1">
                  Now live in your gallery
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
