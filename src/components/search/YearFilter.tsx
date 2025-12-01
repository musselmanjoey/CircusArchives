'use client';

import { Select, type SelectOption } from '@/components/ui/Select';
import { getYearRange } from '@/lib/utils';

export interface YearFilterProps {
  selectedYear?: number;
  onChange: (year: number | undefined) => void;
  startYear?: number;
}

export function YearFilter({ selectedYear, onChange, startYear = 1990 }: YearFilterProps) {
  const years = getYearRange(startYear);
  const yearOptions: SelectOption[] = [
    { value: '', label: 'All Years' },
    ...years.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ];

  const handleChange = (value: string) => {
    onChange(value ? parseInt(value) : undefined);
  };

  return (
    <Select
      id="year-filter"
      label="Year"
      options={yearOptions}
      value={selectedYear?.toString() || ''}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
