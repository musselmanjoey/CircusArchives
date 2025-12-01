'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoSubmitForm, type VideoFormData } from '@/components/video/VideoSubmitForm';
import type { SelectOption } from '@/components/ui/Select';

// TODO: Fetch from API
const mockActs: SelectOption[] = [
  { value: '1', label: 'Juggling' },
  { value: '2', label: 'Aerial Silks' },
  { value: '3', label: 'Trapeze' },
  { value: '4', label: 'Acrobatics' },
  { value: '5', label: 'Clowning' },
];

export default function SubmitPage() {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (data: VideoFormData) => {
    try {
      // TODO: Submit to API
      console.log('Submitting video:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus('success');
      // Redirect to videos page after success
      setTimeout(() => router.push('/videos'), 2000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting video:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Video</h1>
      <p className="text-gray-600 mb-8">
        Share a YouTube video of a circus performance to add it to our archive.
      </p>

      {submitStatus === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">Video submitted successfully!</p>
          <p className="text-green-600 text-sm mt-1">Redirecting to videos page...</p>
        </div>
      ) : submitStatus === 'error' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-medium">Failed to submit video.</p>
          <p className="text-red-600 text-sm mt-1">Please try again later.</p>
        </div>
      ) : null}

      {submitStatus !== 'success' && (
        <VideoSubmitForm acts={mockActs} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
