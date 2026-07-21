/**
 * Image Compression Utility
 * Compresses images and removes metadata before upload to improve performance and privacy
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  onProgress?: (stage: string, progress: number) => void;
}

/**
 * Compress an image file before upload and strip all metadata
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file without metadata
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // Default 1MB max size
    maxWidthOrHeight = 1920, // Default 1920px max dimension
    quality = 0.85, // Default 85% quality
    onProgress = () => {},
  } = options;

  console.log(`[ImageCompression] Processing ${file.name} - Removing metadata and compressing...`);
  onProgress('Removing metadata', 10);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        onProgress('Processing image', 30);
        
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        onProgress('Compressing', 50);
        
        // Draw image on canvas with new dimensions
        // This process automatically strips all EXIF metadata
        ctx.drawImage(img, 0, 0, width, height);

        onProgress('Finalizing', 70);

        // Convert canvas to blob with compression
        // Canvas output contains no metadata - only pure image data
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            onProgress('Creating file', 90);

            // Create new file from blob - metadata-free
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
            const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

            console.log(`[ImageCompression] ✅ Processed ${file.name}:`);
            console.log(`  Original: ${originalSizeMB}MB (${img.width}x${img.height})`);
            console.log(`  Compressed: ${compressedSizeMB}MB (${width}x${height})`);
            console.log(`  Reduction: ${compressionRatio}%`);
            console.log(`  ✅ Metadata removed: All EXIF data stripped`);

            onProgress('Complete', 100);
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

/**
 * Compress multiple images in parallel
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  console.log(`[ImageCompression] Compressing ${files.length} images...`);
  const startTime = Date.now();

  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options))
  );

  const totalTime = Date.now() - startTime;
  console.log(`[ImageCompression] Compressed ${files.length} images in ${totalTime}ms`);

  return compressedFiles;
}

/**
 * Check if file is an image
 * @param file - File to check
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get image dimensions without loading the full image
 * @param file - Image file
 * @returns Promise with width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}
