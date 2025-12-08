'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { VideoUploadForm } from '@/components/video/VideoUploadForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { SelectOption } from '@/components/ui/Select';
import type { Act, ApiResponse, UploadQueueItem } from '@/types';

interface UploadResponse {
  data?: UploadQueueItem;
  error?: string;
  message?: string;
  uploadedImmediately?: boolean;
  dailyUploadsRemaining?: number;
}

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [acts, setActs] = useState<SelectOption[]>([]);
  const [isLoadingActs, setIsLoadingActs] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [uploadedImmediately, setUploadedImmediately] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);

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

  const handleSubmit = async (formData: FormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setUploadedImmediately(false);
      setYoutubeUrl(null);

      // iOS Safari workaround: Convert File to Blob to avoid "string did not match expected pattern" error
      // This error occurs when Safari tries to read certain video file metadata during fetch
      const file = formData.get('file') as File | null;
      if (file) {
        try {
          // Read file as ArrayBuffer and create a new Blob
          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });
          formData.set('file', blob, file.name || 'video.mp4');
        } catch (blobError) {
          console.error('Blob conversion error:', blobError);
          // If blob conversion fails, try with original file
        }
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload video');
      }

      // Set success state with message from API
      setSubmitStatus('success');
      setSuccessMessage(result.message || 'Video uploaded successfully!');
      setUploadedImmediately(result.uploadedImmediately || false);
      if (result.data?.youtubeUrl) {
        setYoutubeUrl(result.data.youtubeUrl);
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload video');
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
              You need to sign in to upload videos to the archive.
            </p>
            <Link href={`/login?callbackUrl=${encodeURIComponent('/upload')}`}>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">Upload Video</h1>
          </div>
          <p className="text-text-muted">
            Upload a video file directly from your device. It will be queued for YouTube upload.
          </p>
          <p className="text-sm text-text-secondary mt-2">
            Uploading as <span className="font-medium text-garnet">{session.user?.name}</span>
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alternative Option */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Already have a YouTube link?</span>
          </div>
          <Link href="/submit" className="text-sm font-medium text-garnet hover:text-garnet-dark transition-colors">
            Submit YouTube URL instead &rarr;
          </Link>
        </div>

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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                uploadedImmediately ? 'bg-success-light' : 'bg-gold/20'
              }`}>
                {uploadedImmediately ? (
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">
                {uploadedImmediately ? 'Video Live on YouTube!' : 'Video Queued!'}
              </h2>
              <p className="text-text-muted mb-4">
                {successMessage}
              </p>
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-garnet hover:text-garnet-dark font-medium mb-6"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch on YouTube
                </a>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => {
                  setSubmitStatus('idle');
                  setErrorMessage('');
                  setSuccessMessage('');
                  setUploadedImmediately(false);
                  setYoutubeUrl(null);
                }}>
                  Upload Another
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
                <p className="font-medium text-error">Upload failed</p>
                <p className="text-error/80 text-sm mt-1">{errorMessage || 'Please try again later.'}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitStatus('idle');
                  setErrorMessage('');
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading Form State */}
        {isLoadingActs && (
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

        {/* Form */}
        {!isLoadingActs && submitStatus !== 'success' && (
          <Card variant="elevated">
            <CardContent className="p-6">
              <VideoUploadForm acts={acts} onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {submitStatus !== 'success' && (
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-text-muted">
              Videos are uploaded to our YouTube channel and will appear in the archive once processed.
            </p>
            <p className="text-xs text-text-light">
              Max file size: 500MB. Supported formats: MP4, MOV, AVI, WebM, MKV
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
