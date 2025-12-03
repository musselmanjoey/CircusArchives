'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { VideoSubmitForm, type VideoFormData } from '@/components/video/VideoSubmitForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { SelectOption } from '@/components/ui/Select';
import type { Act, ApiResponse } from '@/types';

export default function SubmitPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [acts, setActs] = useState<SelectOption[]>([]);
  const [isLoadingActs, setIsLoadingActs] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch acts from API
  useEffect(() => {
    const fetchActs = async () => {
      try {
        const response = await fetch('/api/acts');
        if (!response.ok) throw new Error('Failed to fetch acts');

        const result: ApiResponse<Act[]> = await response.json();
        if (result.data) {
          const actOptions: SelectOption[] = result.data.map((act) => ({
            value: act.id,
            label: act.name,
          }));
          setActs(actOptions);
        }
      } catch (error) {
        console.error('Error fetching acts:', error);
        setErrorMessage('Failed to load act categories. Please refresh the page.');
      } finally {
        setIsLoadingActs(false);
      }
    };

    fetchActs();
  }, []);

  const handleSubmit = async (data: VideoFormData) => {
    try {
      setErrorMessage('');
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit video');
      }

      setSubmitStatus('success');
      // Redirect to videos page after success
      setTimeout(() => router.push('/videos'), 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit video');
      console.error('Error submitting video:', error);
    }
  };

  // Show loading state while checking auth
  if (authStatus === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 text-center">Loading...</p>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need to sign in to submit videos to the archive.
            </p>
            <Link href={`/login?callbackUrl=${encodeURIComponent('/submit')}`}>
              <Button>Sign In to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Video</h1>
      <p className="text-gray-600 mb-8">
        Share a YouTube video of a circus performance to add it to our archive.
        <span className="block text-sm mt-1">
          Submitting as <strong>{session.user.name}</strong>
        </span>
      </p>

      {errorMessage && submitStatus === 'idle' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {submitStatus === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">Video submitted successfully!</p>
          <p className="text-green-600 text-sm mt-1">Redirecting to videos page...</p>
        </div>
      ) : submitStatus === 'error' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-medium">Failed to submit video.</p>
          <p className="text-red-600 text-sm mt-1">{errorMessage || 'Please try again later.'}</p>
        </div>
      ) : null}

      {isLoadingActs ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading form...</p>
        </div>
      ) : submitStatus !== 'success' && (
        <VideoSubmitForm acts={acts} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
