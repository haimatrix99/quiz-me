import { useState, useCallback } from 'react';

interface UploadProgress {
  progress: number;
  isUploading: boolean;
}

interface UploadResult {
  key: string;
  url: string;
  id: string;
}

export function useSupabaseUpload(isSubscribed: boolean) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
  });

  const startUpload = useCallback(async (files: File[]): Promise<UploadResult[] | undefined> => {
    if (!files || files.length === 0) {
      return undefined;
    }

    setUploadProgress({ progress: 0, isUploading: true });

    try {
      const file = files[0]; // Handle single file for now
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev.progress >= 90) {
            clearInterval(progressInterval);
            return { ...prev, progress: 90 };
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      setUploadProgress({ progress: 100, isUploading: false });

      return [{
        key: data.video.key,
        url: data.video.url,
        id: data.video.id,
      }];
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ progress: 0, isUploading: false });
      return undefined;
    }
  }, []);

  return {
    startUpload,
    uploadProgress: uploadProgress.progress,
    isUploading: uploadProgress.isUploading,
  };
}

export { useSupabaseUpload as useUploadThing };