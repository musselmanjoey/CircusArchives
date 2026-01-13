'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { PerformerSelector } from '@/components/video/PerformerSelector';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { getYearRange } from '@/lib/utils';
import type { Performer, ShowType } from '@/types';

export interface VideoSubmitFormProps {
  acts: SelectOption[];
  onSubmit: (data: VideoFormData) => Promise<void>;
}

export interface VideoFormData {
  youtubeUrl: string;
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

export function VideoSubmitForm({ acts, onSubmit }: VideoSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoFormData | 'actIds', string>>>({});
  const [formData, setFormData] = useState<VideoFormData>({
    youtubeUrl: '',
    year: new Date().getFullYear(),
    description: '',
    showType: 'HOME',
    actIds: [],
    performerIds: [],
  });
  const [selectedPerformers, setSelectedPerformers] = useState<Performer[]>([]);

  const years = getYearRange();
  const yearOptions: SelectOption[] = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VideoFormData | 'actIds', string>> = {};

    if (!formData.youtubeUrl) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (!isValidYouTubeUrl(formData.youtubeUrl)) {
      newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
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
    // Clear error when user selects an act
    if (newActIds.length > 0 && errors.actIds) {
      setErrors({ ...errors, actIds: undefined });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="youtubeUrl"
        label="YouTube URL"
        placeholder="https://www.youtube.com/watch?v=..."
        value={formData.youtubeUrl}
        onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
        error={errors.youtubeUrl}
      />

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
          rows={4}
          className="w-full px-4 py-3 border border-border rounded-lg resize-none bg-card text-text placeholder:text-text-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent"
          placeholder="Add any additional details about this performance..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} isLoading={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Submitting...' : 'Submit Video'}
      </Button>
    </form>
  );
}
