'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Performer } from '@/types';

interface PerformerSelectorProps {
  selectedPerformers: Performer[];
  onChange: (performers: Performer[]) => void;
}

export function PerformerSelector({ selectedPerformers, onChange }: PerformerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Performer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewPerformerForm, setShowNewPerformerForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        if (data.data) {
          // Filter out already selected performers
          const filtered = data.data.filter(
            (user: Performer) => !selectedPerformers.some((p) => p.id === user.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedPerformers]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPerformer = useCallback((performer: Performer) => {
    onChange([...selectedPerformers, performer]);
    setSearchQuery('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [selectedPerformers, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleSelectPerformer(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [showDropdown, searchResults, highlightedIndex, handleSelectPerformer]);

  const handleRemovePerformer = useCallback((performerId: string) => {
    onChange(selectedPerformers.filter((p) => p.id !== performerId));
  }, [selectedPerformers, onChange]);

  const handleCreatePerformer = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
        }),
      });

      const data = await response.json();
      if (data.data) {
        handleSelectPerformer(data.data);
        setNewFirstName('');
        setNewLastName('');
        setShowNewPerformerForm(false);
      }
    } catch (error) {
      console.error('Error creating performer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Performers (optional)
      </label>

      {/* Selected performers */}
      {selectedPerformers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedPerformers.map((performer) => (
            <span
              key={performer.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {performer.firstName} {performer.lastName}
              <button
                type="button"
                onClick={() => handleRemovePerformer(performer.id)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div ref={dropdownRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="Search for performers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />

        {/* Dropdown */}
        {showDropdown && (searchQuery || showNewPerformerForm) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              <ul role="listbox">
                {searchResults.map((user, index) => (
                  <li key={user.id} role="option" aria-selected={index === highlightedIndex}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${
                        index === highlightedIndex
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-blue-50'
                      }`}
                      onClick={() => handleSelectPerformer(user)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {user.firstName} {user.lastName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim() && !showNewPerformerForm ? (
              <div className="px-3 py-2">
                <p className="text-sm text-gray-500 mb-2">No performers found</p>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setShowNewPerformerForm(true)}
                >
                  + Add new performer
                </button>
              </div>
            ) : null}

            {/* New performer form */}
            {showNewPerformerForm && (
              <div className="p-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Add new performer</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="First name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="Last name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleCreatePerformer}
                    disabled={isCreating || !newFirstName.trim() || !newLastName.trim()}
                  >
                    {isCreating ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => {
                      setShowNewPerformerForm(false);
                      setNewFirstName('');
                      setNewLastName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Search for existing performers or add new ones
      </p>
    </div>
  );
}
