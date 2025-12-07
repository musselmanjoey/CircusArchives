import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { StorageProvider, StorageResult } from './index';

export class LocalStorage implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    // Local storage directory - can be configured via env
    // Default: uploads folder relative to project, or custom path for network storage
    this.baseDir = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads');

    // Base URL for serving files - in dev this would be your local API route
    // For network storage, this could be a direct URL to the file server
    this.baseUrl = process.env.LOCAL_STORAGE_URL || '/api/files';
  }

  async upload(file: File, pathname: string): Promise<StorageResult> {
    // Ensure directory exists
    // Use manual concatenation for UNC paths since path.join mangles them on Windows
    const fullPath = this.baseDir.startsWith('\\\\')
      ? `${this.baseDir}\\${pathname.replace(/\//g, '\\')}`
      : path.join(this.baseDir, pathname);
    const dir = path.dirname(fullPath);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Convert File to Buffer and write
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    // Return URL that can be used to access the file
    const url = `${this.baseUrl}/${pathname}`;

    return {
      url,
      pathname,
    };
  }

  async delete(url: string): Promise<void> {
    // Extract pathname from URL
    const pathname = url.replace(`${this.baseUrl}/`, '');
    // Use manual concatenation for UNC paths since path.join mangles them on Windows
    const fullPath = this.baseDir.startsWith('\\\\')
      ? `${this.baseDir}\\${pathname.replace(/\//g, '\\')}`
      : path.join(this.baseDir, pathname);

    try {
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    } catch (error) {
      console.error('Failed to delete local file:', error);
      // Don't throw - file might already be deleted
    }
  }

  getPublicUrl(pathname: string): string {
    return `${this.baseUrl}/${pathname}`;
  }
}
