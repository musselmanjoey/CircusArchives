'use client';

import { Select, type SelectOption } from '@/components/ui/Select';
import { YearFilter } from './YearFilter';
import type { VideoFilters } from '@/types';

export interface FilterPanelProps {
  acts: SelectOption[];
  performers: SelectOption[];
  filters: VideoFilters;
  onFilterChange: (filters: VideoFilters) => void;
}

export function FilterPanel({ acts, performers, filters, onFilterChange }: FilterPanelProps) {
  const handleActChange = (actId: string) => {
    onFilterChange({ ...filters, actId: actId || undefined });
  };

  const handleYearChange = (year: number | undefined) => {
    onFilterChange({ ...filters, year });
  };

  const handlePerformerChange = (performerId: string) => {
    onFilterChange({ ...filters, performerId: performerId || undefined });
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
      <div className="w-full sm:w-48">
        <Select
          id="performer-filter"
          label="Performer"
          options={[{ value: '', label: 'All Performers' }, ...performers]}
          value={filters.performerId || ''}
          onChange={(e) => handlePerformerChange(e.target.value)}
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
