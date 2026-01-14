'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SelectOption } from './Select';

export interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allOptionLabel?: string;
}

export function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  allOptionLabel = 'All',
}: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the display label for the current value
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || '';

  // Filter options based on search query
  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    // Include "All" option in navigation count
    const totalOptions = filteredOptions.length + 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === 0) {
          // "All" option selected
          handleSelect('');
        } else if (highlightedIndex > 0 && highlightedIndex <= filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex - 1].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={cn(
            'flex h-11 w-full rounded-lg border bg-card px-4 py-2 text-sm text-text',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent',
            'border-border hover:border-border-strong',
            value && !isOpen ? 'pr-16' : 'pr-10'
          )}
          placeholder={isOpen || !value ? placeholder : ''}
          value={isOpen ? searchQuery : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
          {value && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-text-muted hover:text-text transition-colors"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className={cn(
            'w-5 h-5 text-text-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {/* "All" option */}
            <button
              type="button"
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                highlightedIndex === 0
                  ? 'bg-garnet/10 text-garnet'
                  : 'hover:bg-surface text-text-secondary'
              )}
              onClick={() => handleSelect('')}
              onMouseEnter={() => setHighlightedIndex(0)}
            >
              {allOptionLabel}
            </button>

            {filteredOptions.length > 0 ? (
              <ul role="listbox" className="border-t border-border">
                {filteredOptions.map((option, index) => (
                  <li key={option.value} role="option" aria-selected={index + 1 === highlightedIndex}>
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        index + 1 === highlightedIndex
                          ? 'bg-garnet/10 text-garnet'
                          : option.value === value
                          ? 'bg-surface text-text font-medium'
                          : 'hover:bg-surface text-text'
                      )}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index + 1)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim() ? (
              <div className="px-4 py-3 text-sm text-text-muted border-t border-border">
                No results found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
