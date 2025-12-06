'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoGrid } from '@/components/video/VideoGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { Card } from '@/components/ui/Card';
import type { Video, VideoFilters, Act, ApiResponse, PaginatedResponse, Performer } from '@/types';
import type { SelectOption } from '@/components/ui/Select';

function VideosContent() {
  const searchParams = useSearchParams();
  const initialActId = searchParams.get('actId') || undefined;
  const sortParam = searchParams.get('sort') || undefined;

  const [filters, setFilters] = useState<VideoFilters>({ actId: initialActId });
  const [sortBy, setSortBy] = useState<string | undefined>(sortParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [acts, setActs] = useState<SelectOption[]>([]);
  const [performers, setPerformers] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actName, setActName] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [actsResponse, performersResponse] = await Promise.all([
          fetch('/api/acts'),
          fetch('/api/users'),
        ]);

        if (actsResponse.ok) {
          const actsResult: ApiResponse<Act[]> = await actsResponse.json();
          if (actsResult.data) {
            const actOptions: SelectOption[] = actsResult.data.map((act) => ({
              value: act.id,
              label: act.name,
            }));
            setActs(actOptions);

            if (initialActId) {
              const selectedAct = actsResult.data.find((a) => a.id === initialActId);
              if (selectedAct) {
                setActName(selectedAct.name);
              }
            }
          }
        }

        if (performersResponse.ok) {
          const performersResult: ApiResponse<Performer[]> = await performersResponse.json();
          if (performersResult.data) {
            const performerOptions: SelectOption[] = performersResult.data.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName}`,
            }));
            setPerformers(performerOptions);
          }
        }
      } catch {
        // Handle error silently
      }
    };

    fetchFilters();
  }, [initialActId]);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.actId) params.append('actId', filters.actId);
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.performerId) params.append('performerId', filters.performerId);
        if (sortBy) params.append('sort', sortBy);

        const response = await fetch(`/api/videos?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch videos');

        const result: PaginatedResponse<Video> = await response.json();
        setVideos(result.data);
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [filters, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
  };

  const handleFilterChange = (newFilters: VideoFilters) => {
    setFilters(newFilters);
  };

  const isLeaderboard = sortBy === 'votes' && actName;
  const pageTitle = isLeaderboard ? `${actName} Leaderboard` : 'Browse Videos';
  const pageSubtitle = isLeaderboard
    ? 'Videos ranked by community votes. Performer votes count double!'
    : 'Explore the FSU Flying High Circus video archive';

  return (
    <div className="min-h-[80vh]">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            {isLeaderboard && (
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-garnet-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-text">{pageTitle}</h1>
          </div>
          <p className="text-text-muted">{pageSubtitle}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
          <FilterPanel
            acts={acts}
            performers={performers}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Results count */}
        {!isLoading && videos.length > 0 && (
          <p className="text-sm text-text-muted mb-4">
            Showing {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video skeleton" />
                <div className="p-4">
                  <div className="h-5 skeleton rounded w-2/3 mb-2" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <VideoGrid
            videos={videos}
            emptyMessage="No videos found matching your criteria. Try adjusting your filters."
            showVotes={!!isLeaderboard}
          />
        )}
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh]">
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 skeleton rounded w-48 mb-2" />
            <div className="h-5 skeleton rounded w-72" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-12 skeleton rounded-xl mb-4" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    }>
      <VideosContent />
    </Suspense>
  );
}
