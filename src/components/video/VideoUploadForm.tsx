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

export function VideoUploadForm({ acts, onSubmit }: VideoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof UploadFormData | 'actIds', string>>>({});
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
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
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, file: error });
      return;
    }

    setErrors({ ...errors, file: undefined });
    setFormData({
      ...formData,
      file,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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

    if (!formData.file) {
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

    if (!validate() || !formData.file) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append('file', formData.file);
      // Use filename (without extension) as title
      const title = formData.file.name.replace(/\.[^/.]+$/, '');
      submitData.append('title', title);
      submitData.append('year', formData.year.toString());
      submitData.append('showType', formData.showType);
      submitData.append('description', formData.description.trim());
      formData.actIds.forEach((id) => submitData.append('actIds', id));
      formData.performerIds.forEach((id) => submitData.append('performerIds', id));

      // Simulate progress for better UX (actual progress would need XHR)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      await onSubmit(submitData);

      clearInterval(progressInterval);
      setUploadProgress(100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, file: null });
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

        {!formData.file ? (
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
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi,.webm,.mkv"
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
                <p className="font-medium text-text truncate">{formData.file.name}</p>
                <p className="text-sm text-text-muted">{formatFileSize(formData.file.size)}</p>
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
                  <span className="text-text-secondary">Uploading...</span>
                  <span className="text-garnet font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-garnet transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
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
          disabled={isSubmitting || !formData.file}
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
