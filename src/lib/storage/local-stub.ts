/**
 * Local Storage Stub (Production Build)
 *
 * This is a minimal stub that replaces local.ts in production builds.
 * It contains NO Node.js imports (fs, path) to avoid bundling issues.
 *
 * In production, Vercel Blob is used and this code should never be reached.
 * If it is reached, an error is thrown to indicate misconfiguration.
 */

import type { StorageProvider, StorageResult } from './index';

const PRODUCTION_ERROR = 'LocalStorage is not available in production. Use Vercel Blob (STORAGE_PROVIDER=vercel-blob).';

export class LocalStorage implements StorageProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/files';
    // Don't throw in constructor - class might be instantiated for type checking
  }

  async upload(_file: File, _pathname: string): Promise<StorageResult> {
    throw new Error(PRODUCTION_ERROR);
  }

  async delete(_url: string): Promise<void> {
    throw new Error(PRODUCTION_ERROR);
  }

  getPublicUrl(_pathname: string): string {
    throw new Error(PRODUCTION_ERROR);
  }
}
