'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { VideoSubmitForm, type VideoFormData } from '@/components/video/VideoSubmitForm';
import { VideoUploadForm } from '@/components/video/VideoUploadForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { SelectOption } from '@/components/ui/Select';
import type { Act, ApiResponse } from '@/types';

type SubmitMode = 'upload' | 'youtube' | null;

export default function SubmitPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [mode, setMode] = useState<SubmitMode>(null);
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

  // Handle YouTube URL submission
  const handleYouTubeSubmit = async (data: VideoFormData) => {
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

  // Handle file upload success/error callbacks
  const handleUploadSuccess = (message: string) => {
    setErrorMessage('');
    setSubmitStatus('success');
  };

  const handleUploadError = (error: string) => {
    setSubmitStatus('error');
    setErrorMessage(error);
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const resetToChoice = () => {
    setMode(null);
    setSubmitStatus('idle');
    setErrorMessage('');
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
            Share a circus performance video to add it to our archive.
          </p>
          <p className="text-sm text-text-secondary mt-2">
            Submitting as <span className="font-medium text-garnet">{session.user?.name}</span>
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Initial Choice Screen */}
        {mode === null && submitStatus === 'idle' && (
          <div className="space-y-4">
            <p className="text-center text-text-muted mb-6">
              How would you like to add your video?
            </p>

            {/* YouTube Link Option */}
            <button
              onClick={() => setMode('youtube')}
              className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-garnet/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text group-hover:text-garnet transition-colors">
                    I have a YouTube link
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Submit a video that&apos;s already on YouTube. Just paste the URL and add details.
                  </p>
                </div>
                <svg className="w-5 h-5 text-text-light group-hover:text-garnet transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Upload Option */}
            <button
              onClick={() => setMode('upload')}
              className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-garnet/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-garnet/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-garnet/20 transition-colors">
                  <svg className="w-6 h-6 text-garnet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text group-hover:text-garnet transition-colors">
                    Upload from my device
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Upload a video file from your phone or computer. It will be published to the archive&apos;s YouTube channel.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Video will be uploaded to YouTube
                  </div>
                </div>
                <svg className="w-5 h-5 text-text-light group-hover:text-garnet transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Back Button when mode is selected */}
        {mode !== null && submitStatus === 'idle' && (
          <button
            onClick={resetToChoice}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-garnet transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>
        )}

        {/* Upload Disclaimer */}
        {mode === 'upload' && submitStatus === 'idle' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-amber-800">This will upload to YouTube</p>
                <p className="text-sm text-amber-700 mt-1">
                  Your video will be published to the FSU Flying High Circus Archives YouTube channel as an unlisted video.
                  Only people with the link (through this archive) will be able to view it.
                </p>
              </div>
            </div>
          </div>
        )}

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
              <h2 className="text-xl font-semibold text-text mb-2">
                {mode === 'upload' ? 'Video Uploaded!' : 'Video Submitted!'}
              </h2>
              <p className="text-text-muted mb-6">
                {mode === 'upload'
                  ? "Your video has been added to the upload queue. It will appear in the archive once it's processed."
                  : 'Redirecting to videos page...'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={resetForm}>
                  Submit Another
                </Button>
                <Button variant="secondary" onClick={() => router.push('/videos')}>
                  Browse Videos
                </Button>
              </div>
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
              <div className="flex-1">
                <p className="font-medium text-error">
                  {mode === 'upload' ? 'Upload failed' : 'Failed to submit video'}
                </p>
                <p className="text-error/80 text-sm mt-1">{errorMessage || 'Please try again later.'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading Form State */}
        {isLoadingActs && mode !== null && (
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-32 skeleton rounded-xl" />
                <div className="h-5 skeleton rounded w-24" />
                <div className="h-11 skeleton rounded-lg" />
                <div className="h-5 skeleton rounded w-20" />
                <div className="h-11 skeleton rounded-lg" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms */}
        {!isLoadingActs && submitStatus === 'idle' && mode !== null && (
          <Card variant="elevated">
            <CardContent className="p-6">
              {mode === 'upload' ? (
                <VideoUploadForm acts={acts} onSuccess={handleUploadSuccess} onError={handleUploadError} />
              ) : (
                <VideoSubmitForm acts={acts} onSubmit={handleYouTubeSubmit} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {submitStatus === 'idle' && mode !== null && (
          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              {mode === 'upload' ? (
                <>Max file size: 2GB. Supported formats: MP4, MOV, AVI, WebM, MKV</>
              ) : (
                <>
                  Only YouTube videos are supported.{' '}
                  <Link href="/about" className="text-garnet hover:text-garnet-dark transition-colors">
                    Learn more
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
