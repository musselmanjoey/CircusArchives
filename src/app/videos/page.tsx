'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoGrid } from '@/components/video/VideoGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import type { Video, VideoFilters, Act, ApiResponse, PaginatedResponse, Performer } from '@/types';
import type { SelectOption } from '@/components/ui/Select';

export default function VideosPage() {
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

  // Fetch acts and performers
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

            // Set act name if filtering by act
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
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, []);

  // Fetch videos based on filters
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
      } catch (error) {
        console.error('Error fetching videos:', error);
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

  // Determine page title based on sort and filter
  const isLeaderboard = sortBy === 'votes' && actName;
  const pageTitle = isLeaderboard ? `${actName} Leaderboard` : 'Browse Videos';
  const pageSubtitle = isLeaderboard
    ? 'Videos ranked by community votes. Performer votes count double!'
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
        {pageSubtitle && (
          <p className="text-gray-600 mb-4">{pageSubtitle}</p>
        )}
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

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading videos...</p>
        </div>
      ) : (
        <VideoGrid
          videos={videos}
          emptyMessage="No videos found. Be the first to submit a video!"
        />
      )}
    </div>
  );
}
