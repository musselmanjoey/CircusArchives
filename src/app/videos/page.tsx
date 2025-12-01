'use client';

import { useState, useEffect } from 'react';
import { VideoGrid } from '@/components/video/VideoGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import type { Video, VideoFilters, Act, ApiResponse, PaginatedResponse } from '@/types';
import type { SelectOption } from '@/components/ui/Select';

export default function VideosPage() {
  const [filters, setFilters] = useState<VideoFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [acts, setActs] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch acts
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
      }
    };

    fetchActs();
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
  }, [filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
  };

  const handleFilterChange = (newFilters: VideoFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Videos</h1>
        <div className="space-y-4">
          <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
          <FilterPanel
            acts={acts}
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
