// Storage abstraction layer
// Switch between local file storage (dev) and Vercel Blob (prod) via STORAGE_PROVIDER env var

export interface StorageResult {
  url: string;
  pathname: string;
}

export interface StorageProvider {
  upload(file: File, pathname: string): Promise<StorageResult>;
  delete(url: string): Promise<void>;
  getPublicUrl(pathname: string): string;
}

// Check if we're using Vercel Blob (production) - checked at runtime
const isVercelBlob = () => process.env.STORAGE_PROVIDER === 'vercel-blob';

// Export the active provider based on config
export async function getStorageProvider(): Promise<StorageProvider> {
  if (isVercelBlob()) {
    const { VercelBlobStorage } = await import('./vercel-blob');
    return new VercelBlobStorage();
  }

  // Local storage - always use the stub to avoid bundling Node.js modules
  // The stub will throw an error in production, which is expected
  const { LocalStorage } = await import('./local-stub');
  return new LocalStorage();
}

// Convenience functions
export async function uploadFile(file: File, pathname: string): Promise<StorageResult> {
  const provider = await getStorageProvider();
  return provider.upload(file, pathname);
}

export async function deleteFile(url: string): Promise<void> {
  const provider = await getStorageProvider();
  return provider.delete(url);
}

/**
 * Get the local filesystem path for a stored file
 * Only works with local storage provider - will throw in production
 */
export async function getLocalFilePath(blobUrl: string): Promise<string> {
  if (isVercelBlob()) {
    throw new Error('getLocalFilePath is not available with Vercel Blob storage');
  }

  // Dynamic import to avoid bundling path module in production
  const path = await import('path');

  const baseDir = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads');
  const baseUrl = process.env.LOCAL_STORAGE_URL || '/api/files';

  // Extract pathname from URL (e.g., /api/files/uploads/userId/file.mp4 -> uploads/userId/file.mp4)
  const pathname = blobUrl.replace(`${baseUrl}/`, '');

  // Handle UNC paths on Windows
  if (baseDir.startsWith('\\\\')) {
    return `${baseDir}\\${pathname.replace(/\//g, '\\')}`;
  }

  return path.join(baseDir, pathname);
}
