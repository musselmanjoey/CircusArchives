import { put, del } from '@vercel/blob';
import type { StorageProvider, StorageResult } from './index';

export class VercelBlobStorage implements StorageProvider {
  async upload(file: File, pathname: string): Promise<StorageResult> {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  }

  async delete(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      console.error('Failed to delete blob:', error);
      // Don't throw - blob might already be deleted
    }
  }

  getPublicUrl(pathname: string): string {
    // Vercel Blob URLs are returned directly from upload
    // This is mainly for interface consistency
    return pathname;
  }
}
