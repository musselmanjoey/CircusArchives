/**
 * Local Storage Stub for Production Builds
 *
 * This is an empty stub that replaces local.ts in Vercel production builds
 * to avoid bundling Node.js fs/path modules which exceed size limits.
 *
 * In production, files are stored in Vercel Blob and this module is never used.
 */

import type { StorageProvider, StorageResult } from './index';

export class LocalStorage implements StorageProvider {
  constructor() {
    throw new Error('LocalStorage is not available in production. Use Vercel Blob instead.');
  }

  async upload(_file: File, _pathname: string): Promise<StorageResult> {
    throw new Error('LocalStorage is not available in production.');
  }

  async delete(_url: string): Promise<void> {
    throw new Error('LocalStorage is not available in production.');
  }

  getPublicUrl(_pathname: string): string {
    throw new Error('LocalStorage is not available in production.');
  }
}
