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

// Export the active provider based on config
export async function getStorageProvider(): Promise<StorageProvider> {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 'vercel-blob') {
    const { VercelBlobStorage } = await import('./vercel-blob');
    return new VercelBlobStorage();
  }

  const { LocalStorage } = await import('./local');
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
