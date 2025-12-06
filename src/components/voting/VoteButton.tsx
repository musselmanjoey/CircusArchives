'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import type { Vote, ApiResponse } from '@/types';

interface VoteButtonProps {
  videoId: string;
  actId: string;
  actName: string;
  onVoteChange?: () => void;
}

export function VoteButton({ videoId, actId, actName, onVoteChange }: VoteButtonProps) {
  const { data: session } = useSession();
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setIsFetching(false);
      return;
    }

    const fetchUserVotes = async () => {
      try {
        const response = await fetch('/api/votes/me');
        if (response.ok) {
          const data: ApiResponse<Vote[]> = await response.json();
          const voteForAct = data.data?.find((v) => v.actId === actId);
          setUserVote(voteForAct || null);
        }
      } catch {
        // Ignore fetch errors
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserVotes();
  }, [session, actId]);

  const hasVotedForThisVideo = userVote?.videoId === videoId;
  const hasVotedForDifferentVideo = userVote && userVote.videoId !== videoId;

  const handleVote = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, actId }),
      });

      if (response.ok) {
        const data: ApiResponse<Vote> = await response.json();
        setUserVote(data.data || null);
        onVoteChange?.();
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!session?.user || !userVote) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/votes/${actId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserVote(null);
        onVoteChange?.();
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  if (isFetching) {
    return (
      <div className="h-10 w-32 skeleton rounded-lg" />
    );
  }

  if (hasVotedForThisVideo) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleRemoveVote}
          disabled={isLoading}
          isLoading={isLoading}
          className="bg-success hover:bg-green-700"
        >
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {isLoading ? 'Updating...' : `Your Best ${actName}`}
        </Button>
        <button
          onClick={handleRemoveVote}
          className="text-xs text-text-muted hover:text-garnet transition-colors"
          disabled={isLoading}
        >
          Remove vote
        </button>
      </div>
    );
  }

  if (hasVotedForDifferentVideo) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleVote}
          disabled={isLoading}
          isLoading={isLoading}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isLoading ? 'Switching...' : `Vote Best ${actName}`}
        </Button>
        <span className="text-xs text-warning flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          You voted for a different {actName}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      isLoading={isLoading}
    >
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
      {isLoading ? 'Voting...' : `Vote Best ${actName}`}
    </Button>
  );
}
