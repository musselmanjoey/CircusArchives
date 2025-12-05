'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { VoteWithDetails, ApiResponse } from '@/types';

interface VotersListProps {
  videoId: string;
  voteCount: number;
}

export function VotersList({ videoId, voteCount }: VotersListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voters, setVoters] = useState<VoteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVoters = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/videos/${videoId}/voters`);
        if (response.ok) {
          const data: ApiResponse<VoteWithDetails[]> = await response.json();
          setVoters(data.data || []);
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoters();
  }, [isOpen, videoId]);

  if (voteCount === 0) {
    return <span className="text-sm text-gray-500">No votes yet</span>;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
      >
        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Votes</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </Button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : voters.length === 0 ? (
                <p className="text-center text-gray-500">No voters found</p>
              ) : (
                <ul className="space-y-3">
                  {voters.map((voter) => (
                    <li
                      key={voter.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {voter.user?.firstName?.[0]}
                          {voter.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {voter.user?.firstName} {voter.user?.lastName}
                          </p>
                          {voter.isPerformer && (
                            <span className="text-xs text-purple-600 font-medium">
                              Performer (2x vote)
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
