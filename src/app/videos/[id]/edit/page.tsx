'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { PerformerSelector } from '@/components/video/PerformerSelector';
import { getYearRange } from '@/lib/utils';
import type { Video, Act, ApiResponse, Performer, ShowType } from '@/types';

interface EditVideoPageProps {
  params: Promise<{ id: string }>;
}

const showTypeOptions: SelectOption[] = [
  { value: 'HOME', label: 'Home Show' },
  { value: 'CALLAWAY', label: 'Callaway Show' },
];

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
  const [actIds, setActIds] = useState<string[]>([]);
  const [showType, setShowType] = useState<ShowType>('HOME');
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
          setShowType(videoData.data.showType || 'HOME');
          setDescription(videoData.data.description || '');

          // V5: Set actIds from acts array or legacy act field
          if (videoData.data.acts?.length) {
            setActIds(videoData.data.acts.map((va) => va.actId));
          } else if (videoData.data.act) {
            setActIds([videoData.data.act.id]);
          }

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
          actIds,
          showType,
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
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-text mb-2">Sign In Required</h2>
          <p className="text-text-muted mb-4">You must be signed in to edit videos.</p>
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
        <div className="bg-red-50 text-error p-4 rounded-md">{error}</div>
        <Link href="/videos">
          <Button variant="ghost" className="mt-4">&larr; Back to Videos</Button>
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gold/20 text-gold-dark p-4 rounded-md">
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

      <div className="bg-card rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-text mb-6">Edit Video</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="year"
              label="Year"
              options={yearOptions}
              value={year.toString()}
              onChange={(e) => setYear(parseInt(e.target.value))}
            />

            <Select
              id="showType"
              label="Show Type"
              options={showTypeOptions}
              value={showType}
              onChange={(e) => setShowType(e.target.value as ShowType)}
            />
          </div>

          {/* Multi-select Acts */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Act Categories <span className="text-text-muted">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {acts.map((act) => {
                const isSelected = actIds.includes(act.value);
                return (
                  <button
                    key={act.value}
                    type="button"
                    onClick={() => {
                      setActIds(
                        isSelected
                          ? actIds.filter((id) => id !== act.value)
                          : [...actIds, act.value]
                      );
                    }}
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
            {actIds.length === 0 && (
              <p className="mt-2 text-sm text-error flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select at least one act
              </p>
            )}
            {actIds.length > 1 && (
              <p className="mt-2 text-sm text-gold-dark flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                This video will appear in {actIds.length} act categories
              </p>
            )}
          </div>

          <PerformerSelector
            selectedPerformers={selectedPerformers}
            onChange={setSelectedPerformers}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving || actIds.length === 0} isLoading={isSaving}>
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
