'use client';

import { Select, type SelectOption } from '@/components/ui/Select';
import { YearFilter } from './YearFilter';
import type { VideoFilters } from '@/types';

export interface FilterPanelProps {
  acts: SelectOption[];
  filters: VideoFilters;
  onFilterChange: (filters: VideoFilters) => void;
}

export function FilterPanel({ acts, filters, onFilterChange }: FilterPanelProps) {
  const handleActChange = (actId: string) => {
    onFilterChange({ ...filters, actId: actId || undefined });
  };

  const handleYearChange = (year: number | undefined) => {
    onFilterChange({ ...filters, year });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-48">
        <Select
          id="act-filter"
          label="Act Category"
          options={[{ value: '', label: 'All Acts' }, ...acts]}
          value={filters.actId || ''}
          onChange={(e) => handleActChange(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-36">
        <YearFilter
          selectedYear={filters.year}
          onChange={handleYearChange}
        />
      </div>
    </div>
  );
}
