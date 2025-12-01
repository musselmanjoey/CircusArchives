'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { getYearRange } from '@/lib/utils';

export interface VideoSubmitFormProps {
  acts: SelectOption[];
  onSubmit: (data: VideoFormData) => Promise<void>;
}

export interface VideoFormData {
  youtubeUrl: string;
  title: string;
  year: number;
  description: string;
  actId: string;
}

export function VideoSubmitForm({ acts, onSubmit }: VideoSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoFormData, string>>>({});
  const [formData, setFormData] = useState<VideoFormData>({
    youtubeUrl: '',
    title: '',
    year: new Date().getFullYear(),
    description: '',
    actId: '',
  });

  const years = getYearRange(1990);
  const yearOptions: SelectOption[] = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VideoFormData, string>> = {};

    if (!formData.youtubeUrl) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (!isValidYouTubeUrl(formData.youtubeUrl)) {
      newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.actId) {
      newErrors.actId = 'Please select an act category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <Input
        id="youtubeUrl"
        label="YouTube URL"
        placeholder="https://www.youtube.com/watch?v=..."
        value={formData.youtubeUrl}
        onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
        error={errors.youtubeUrl}
      />

      <Input
        id="title"
        label="Title"
        placeholder="Enter video title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="year"
          label="Year"
          options={yearOptions}
          value={formData.year.toString()}
          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
        />

        <Select
          id="actId"
          label="Act Category"
          options={acts}
          placeholder="Select an act"
          value={formData.actId}
          onChange={(e) => setFormData({ ...formData, actId: e.target.value })}
          error={errors.actId}
        />
      </div>

      <div className="w-full">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={4}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="Add any additional details about this performance..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Video'}
      </Button>
    </form>
  );
}
