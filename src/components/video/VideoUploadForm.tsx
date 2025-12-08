'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { PerformerSelector } from '@/components/video/PerformerSelector';
import { getYearRange, formatFileSize } from '@/lib/utils';
import type { Performer, ShowType } from '@/types';

export interface VideoUploadFormProps {
  acts: SelectOption[];
  onSubmit: (formData: FormData) => Promise<void>;
}

export interface UploadFormData {
  file: File | null;
  fileBlob: Blob | null;  // Pre-converted blob for iOS Safari compatibility
  fileName: string;       // Store filename separately since Blob doesn't have .name
  fileSize: number;       // Store size separately for display
  year: number;
  description: string;
  showType: ShowType;
  actIds: string[];
  performerIds: string[];
}

const showTypeOptions: SelectOption[] = [
  { value: 'HOME', label: 'Home Show' },
  { value: 'CALLAWAY', label: 'Callaway Show' },
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

// Safe file property accessors for iOS Safari compatibility
// Safari can throw "string did not match expected pattern" when accessing file properties
function safeFileName(file: File | null): string {
  if (!file) return 'Unknown file';
  try {
    return file.name || 'Video file';
  } catch {
    return 'Video file';
  }
}

function safeFileSize(file: File | null): string {
  if (!file) return '';
  try {
    const size = file.size;
    if (typeof size !== 'number' || isNaN(size)) return 'Unknown size';
    return formatFileSize(size);
  } catch {
    return 'Unknown size';
  }
}

export function VideoUploadForm({ acts, onSubmit }: VideoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof UploadFormData | 'actIds', string>>>({});
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    fileBlob: null,
    fileName: '',
    fileSize: 0,
    year: new Date().getFullYear(),
    description: '',
    showType: 'HOME',
    actIds: [],
    performerIds: [],
  });
  const [selectedPerformers, setSelectedPerformers] = useState<Performer[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const years = getYearRange(1990);
  const yearOptions: SelectOption[] = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const validateFile = (file: File): string | null => {
    try {
      // iOS Safari has bugs reading file properties - be very defensive here
      // Server will do strict validation, client just does basic checks

      // Try to get file size - this is the most reliable property
      let fileSize = 0;
      try {
        fileSize = file.size || 0;
      } catch {
        // If we can't read size, let server handle it
        return null;
      }

      if (fileSize > MAX_FILE_SIZE) {
        return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
      }

      // Skip extension check on client - iOS can have issues with .mov/.heic files
      // Server will validate the actual file type
      return null;
    } catch (err) {
      // If anything fails, just let it through - server will validate
      console.error('File validation error (non-blocking):', err);
      return null;
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const error = validateFile(file);
      if (error) {
        setErrors({ ...errors, file: error });
        return;
      }

      // iOS Safari workaround: Immediately convert File to Blob and extract properties
      // This avoids the "string did not match expected pattern" error that occurs
      // when accessing File properties later during FormData.append()
      let fileName = 'video.mp4';
      let fileSize = 0;
      let fileType = 'video/mp4';

      try {
        fileName = file.name || 'video.mp4';
      } catch (e) {
        // Show error in UI for debugging on iOS
        setErrors({ ...errors, file: `Step 1 failed (file.name): ${e instanceof Error ? e.message : String(e)}` });
        return;
      }

      try {
        fileSize = file.size || 0;
      } catch (e) {
        setErrors({ ...errors, file: `Step 2 failed (file.size): ${e instanceof Error ? e.message : String(e)}` });
        return;
      }

      try {
        fileType = file.type || 'video/mp4';
      } catch (e) {
        setErrors({ ...errors, file: `Step 3 failed (file.type): ${e instanceof Error ? e.message : String(e)}` });
        return;
      }

      // Convert to Blob using FileReader (better iOS compatibility than arrayBuffer)
      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(new Blob([reader.result], { type: fileType }));
            } else {
              reject(new Error('FileReader did not return ArrayBuffer'));
            }
          };
          reader.onerror = () => reject(reader.error || new Error('FileReader error'));
          reader.readAsArrayBuffer(file);
        });

        setErrors({ ...errors, file: undefined });
        setFormData({
          ...formData,
          file,
          fileBlob: blob,
          fileName,
          fileSize,
        });
      } catch (blobErr) {
        setErrors({ ...errors, file: `Step 4 failed (FileReader): ${blobErr instanceof Error ? blobErr.message : String(blobErr)}` });
        return;
      }
    } catch (err) {
      setErrors({ ...errors, file: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      // iOS Safari workaround: Access files list very carefully
      const input = e.target;
      if (!input) {
        setErrors({ ...errors, file: 'Error: No input target' });
        return;
      }

      const files = input.files;
      if (!files || files.length === 0) {
        return; // No file selected, not an error
      }

      const file = files[0];
      if (file) {
        handleFileSelect(file);
      }
    } catch (err) {
      // iOS Safari can throw "string did not match expected pattern" error
      // Show the actual error message so we can debug on iOS
      setErrors({ ...errors, file: `File input error: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UploadFormData | 'actIds', string>> = {};

    if (!formData.fileBlob) {
      newErrors.file = 'Please select a video file';
    }

    if (!formData.showType) {
      newErrors.showType = 'Please select show type';
    }

    if (formData.actIds.length === 0) {
      newErrors.actIds = 'Please select at least one act';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePerformersChange = (performers: Performer[]) => {
    setSelectedPerformers(performers);
    setFormData({ ...formData, performerIds: performers.map((p) => p.id) });
  };

  const handleActToggle = (actId: string) => {
    const newActIds = formData.actIds.includes(actId)
      ? formData.actIds.filter((id) => id !== actId)
      : [...formData.actIds, actId];
    setFormData({ ...formData, actIds: newActIds });
    if (newActIds.length > 0 && errors.actIds) {
      setErrors({ ...errors, actIds: undefined });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate() || !formData.fileBlob) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const submitData = new FormData();

      // iOS Safari fix: Use the pre-converted Blob with stored filename
      // This avoids the "string did not match expected pattern" error
      try {
        submitData.append('file', formData.fileBlob, formData.fileName || 'video.mp4');
      } catch (appendErr) {
        setErrors({ ...errors, file: `FormData.append failed: ${appendErr instanceof Error ? appendErr.message : String(appendErr)}` });
        setIsSubmitting(false);
        return;
      }

      // Use stored filename (without extension) as title
      const title = formData.fileName.replace(/\.[^/.]+$/, '') || 'Untitled Video';
      submitData.append('title', title);
      submitData.append('year', formData.year.toString());
      submitData.append('showType', formData.showType);
      submitData.append('description', formData.description.trim());
      formData.actIds.forEach((id) => submitData.append('actIds', id));
      formData.performerIds.forEach((id) => submitData.append('performerIds', id));

      // Simulate progress for better UX (actual progress would need XHR)
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      await onSubmit(submitData);

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (submitErr) {
      if (progressInterval) clearInterval(progressInterval);
      setErrors({ ...errors, file: `Submit error: ${submitErr instanceof Error ? submitErr.message : String(submitErr)}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, file: null, fileBlob: null, fileName: '', fileSize: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Video File
        </label>

        {!formData.fileBlob ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${dragActive
                ? 'border-garnet bg-garnet/5'
                : errors.file
                  ? 'border-error bg-error/5'
                  : 'border-border hover:border-garnet hover:bg-surface'
              }
            `}
          >
            {/*
              iOS Safari has bugs with accept attribute and video MIME type detection.
              Removing accept allows any file but we validate server-side.
              capture="environment" helps with direct camera recording on mobile.
            */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                dragActive ? 'bg-garnet/10' : 'bg-surface'
              }`}>
                <svg className={`w-7 h-7 ${dragActive ? 'text-garnet' : 'text-text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <p className="font-medium text-text">
                  {dragActive ? 'Drop your video here' : 'Tap to select or drag video'}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  MP4, MOV, AVI, WebM, MKV up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-4 bg-surface">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-garnet/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-garnet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-text truncate">{formData.fileName || 'Video file'}</p>
                <p className="text-sm text-text-muted">{formData.fileSize > 0 ? formatFileSize(formData.fileSize) : ''}</p>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isSubmitting && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Uploading to YouTube...</span>
                  <span className="text-garnet font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-garnet transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  This may take a few minutes. Please don&apos;t close this page.
                </p>
              </div>
            )}
          </div>
        )}

        {errors.file && (
          <p className="mt-2 text-sm text-error flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.file}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="year"
          label="Year"
          options={yearOptions}
          value={formData.year.toString()}
          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
        />

        <Select
          id="showType"
          label="Show Type"
          options={showTypeOptions}
          value={formData.showType}
          onChange={(e) => setFormData({ ...formData, showType: e.target.value as ShowType })}
          error={errors.showType}
        />
      </div>

      {/* Multi-select Acts */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Act Categories <span className="text-text-muted">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {acts.map((act) => {
            const isSelected = formData.actIds.includes(act.value);
            return (
              <button
                key={act.value}
                type="button"
                onClick={() => handleActToggle(act.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                  isSelected
                    ? 'bg-garnet text-white border-garnet'
                    : 'bg-card text-text-secondary border-border hover:border-garnet hover:text-garnet'
                }`}
              >
                {isSelected && (
                  <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {act.label}
              </button>
            );
          })}
        </div>
        {errors.actIds && (
          <p className="mt-2 text-sm text-error flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.actIds}
          </p>
        )}
        {formData.actIds.length > 1 && (
          <p className="mt-2 text-sm text-gold-dark flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            This video will appear in {formData.actIds.length} act categories
          </p>
        )}
      </div>

      <PerformerSelector
        selectedPerformers={selectedPerformers}
        onChange={handlePerformersChange}
      />

      <div className="w-full">
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1.5">
          Description <span className="text-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-lg resize-none bg-card text-text placeholder:text-text-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent"
          placeholder="Add any additional details about this performance..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !formData.fileBlob}
          isLoading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Uploading...' : 'Upload Video'}
        </Button>

        <p className="text-xs text-text-muted text-center mt-3">
          Videos will be queued for upload to YouTube. You&apos;ll be notified when it&apos;s live.
        </p>
      </div>
    </form>
  );
}
