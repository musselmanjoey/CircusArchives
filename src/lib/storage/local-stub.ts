/**
 * Local Storage Stub
 *
 * Contains NO Node.js imports (fs, path) to prevent bundling issues.
 * Always throws errors - local storage is only for development.
 *
 * For local development, set STORAGE_PROVIDER to empty or don't set it,
 * and use a separate local file server if needed.
 */

import type { StorageProvider, StorageResult } from './index';

const ERROR_MSG = 'LocalStorage is not available. Set STORAGE_PROVIDER=vercel-blob for production.';

export class LocalStorage implements StorageProvider {
  constructor() {
    // Constructor doesn't throw to allow type checking
  }

  async upload(_file: File, _pathname: string): Promise<StorageResult> {
    throw new Error(ERROR_MSG);
  }

  async delete(_url: string): Promise<void> {
    throw new Error(ERROR_MSG);
  }

  getPublicUrl(_pathname: string): string {
    throw new Error(ERROR_MSG);
  }
}
