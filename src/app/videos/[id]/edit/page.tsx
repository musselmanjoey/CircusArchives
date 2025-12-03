'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { PerformerSelector } from '@/components/video/PerformerSelector';
import { getYearRange } from '@/lib/utils';
import type { Video, Act, ApiResponse, Performer } from '@/types';

interface EditVideoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditVideoPage({ params }: EditVideoPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [video, setVideo] = useState<Video | null>(null);
  const [acts, setActs] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [actId, setActId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedPerformers, setSelectedPerformers] = useState<Performer[]>([]);

  const years = getYearRange(1990);
  const yearOptions: SelectOption[] = years.map((y) => ({
    value: y.toString(),
    label: y.toString(),
  }));

  // Fetch video and acts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videoRes, actsRes] = await Promise.all([
          fetch(`/api/videos/${id}`),
          fetch('/api/acts'),
        ]);

        if (!videoRes.ok) {
          setError('Video not found');
          return;
        }

        const videoData: ApiResponse<Video> = await videoRes.json();
        const actsData: ApiResponse<Act[]> = await actsRes.json();

        if (videoData.data) {
          setVideo(videoData.data);
          setYear(videoData.data.year);
          setActId(videoData.data.actId);
          setDescription(videoData.data.description || '');

          // Convert performers to Performer type
          if (videoData.data.performers) {
            setSelectedPerformers(
              videoData.data.performers.map((vp) => vp.user)
            );
          }
        }

        if (actsData.data) {
          setActs(
            actsData.data.map((act) => ({
              value: act.id,
              label: act.name,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Check authorization
  const isOwner = video?.uploaderId === session?.user?.id;
  const canEdit = isOwner || (session?.user as { role?: string })?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          actId,
          description,
          performerIds: selectedPerformers.map((p) => p.id),
        }),
      });

      const result: ApiResponse<Video> = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update video');
        return;
      }

      router.push(`/videos/${id}`);
    } catch (err) {
      console.error('Error updating video:', err);
      setError('Failed to update video');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">You must be signed in to edit videos.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
        <Link href="/videos">
          <Button variant="ghost" className="mt-4">&larr; Back to Videos</Button>
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          You don&apos;t have permission to edit this video.
        </div>
        <Link href={`/videos/${id}`}>
          <Button variant="ghost" className="mt-4">&larr; Back to Video</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/videos/${id}`}>
        <Button variant="ghost" className="mb-4">&larr; Back to Video</Button>
      </Link>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Video</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="year"
              label="Year"
              options={yearOptions}
              value={year.toString()}
              onChange={(e) => setYear(parseInt(e.target.value))}
            />

            <Select
              id="actId"
              label="Act Category"
              options={acts}
              value={actId}
              onChange={(e) => setActId(e.target.value)}
            />
          </div>

          <PerformerSelector
            selectedPerformers={selectedPerformers}
            onChange={setSelectedPerformers}
          />

          <div className="w-full">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Add any additional details about this performance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/videos/${id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
