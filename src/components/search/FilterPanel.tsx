'use client';

import { Select, type SelectOption } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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

  const hasActiveFilters = filters.actId || filters.year || filters.performerId;

  const clearFilters = () => {
    onFilterChange({ search: filters.search });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Select
            id="act-filter"
            label="Act Category"
            options={[{ value: '', label: 'All Acts' }, ...acts]}
            value={filters.actId || ''}
            onChange={(e) => handleActChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <SearchableSelect
            id="performer-filter"
            label="Performer"
            options={performers}
            value={filters.performerId || ''}
            onChange={handlePerformerChange}
            placeholder="Search performers..."
            allOptionLabel="All Performers"
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <YearFilter
            selectedYear={filters.year}
            onChange={handleYearChange}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-11 px-4 text-sm font-medium text-garnet hover:text-garnet-dark transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
