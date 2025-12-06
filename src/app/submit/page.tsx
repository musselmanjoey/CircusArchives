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
      } catch {
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
      setTimeout(() => router.push('/videos'), 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit video');
    }
  };

  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card variant="elevated" className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 skeleton rounded-xl mx-auto mb-4" />
            <div className="h-6 skeleton rounded w-48 mx-auto mb-2" />
            <div className="h-4 skeleton rounded w-64 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sign-in required
  if (!session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <p className="text-text-muted mb-6">
              You need to sign in to submit videos to the archive.
            </p>
            <Link href={`/login?callbackUrl=${encodeURIComponent('/submit')}`}>
              <Button size="lg" className="w-full">Sign In to Continue</Button>
            </Link>
            <div className="mt-4">
              <Link href="/" className="text-sm text-garnet hover:text-garnet-dark transition-colors">
                &larr; Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-garnet rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">Submit a Video</h1>
          </div>
          <p className="text-text-muted">
            Share a YouTube video of a circus performance to add it to our archive.
          </p>
          <p className="text-sm text-text-secondary mt-2">
            Submitting as <span className="font-medium text-garnet">{session.user?.name}</span>
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {errorMessage && submitStatus === 'idle' && (
          <div className="bg-error-light border border-error/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-error">{errorMessage}</p>
          </div>
        )}

        {/* Success State */}
        {submitStatus === 'success' && (
          <Card variant="elevated" className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Video Submitted!</h2>
              <p className="text-text-muted">Redirecting to videos page...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {submitStatus === 'error' && (
          <div className="bg-error-light border border-error/20 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-error shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-error">Failed to submit video</p>
                <p className="text-error/80 text-sm mt-1">{errorMessage || 'Please try again later.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Form State */}
        {isLoadingActs && (
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-5 skeleton rounded w-24" />
                <div className="h-11 skeleton rounded-lg" />
                <div className="h-5 skeleton rounded w-20" />
                <div className="h-11 skeleton rounded-lg" />
                <div className="h-5 skeleton rounded w-16" />
                <div className="h-11 skeleton rounded-lg" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {!isLoadingActs && submitStatus !== 'success' && (
          <Card variant="elevated">
            <CardContent className="p-6">
              <VideoSubmitForm acts={acts} onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {submitStatus !== 'success' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              Only YouTube videos are supported.{' '}
              <Link href="/about" className="text-garnet hover:text-garnet-dark transition-colors">
                Learn more
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
