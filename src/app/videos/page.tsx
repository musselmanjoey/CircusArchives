'use client';

import { useState } from 'react';
import { VideoGrid } from '@/components/video/VideoGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import type { Video, VideoFilters } from '@/types';
import type { SelectOption } from '@/components/ui/Select';

// TODO: Fetch from API
const mockActs: SelectOption[] = [
  { value: '1', label: 'Juggling' },
  { value: '2', label: 'Aerial Silks' },
  { value: '3', label: 'Trapeze' },
];

// TODO: Fetch from API
const mockVideos: Video[] = [];

export default function VideosPage() {
  const [filters, setFilters] = useState<VideoFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

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
            acts={mockActs}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <VideoGrid
        videos={mockVideos}
        emptyMessage="No videos found. Be the first to submit a video!"
      />
    </div>
  );
}
