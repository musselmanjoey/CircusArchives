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

  // Fetch user's current vote for this act
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
        body: JSON.stringify({ videoId }),
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
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (hasVotedForThisVideo) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleRemoveVote}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Updating...' : `Your Best ${actName}`}
        </Button>
        <button
          onClick={handleRemoveVote}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
          disabled={isLoading}
        >
          Remove vote
        </button>
      </div>
    );
  }

  if (hasVotedForDifferentVideo) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleVote}
          disabled={isLoading}
        >
          {isLoading ? 'Switching...' : `Vote Best ${actName}`}
        </Button>
        <span className="text-xs text-amber-600">
          You voted for a different {actName} video
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
    >
      {isLoading ? 'Voting...' : `Vote Best ${actName}`}
    </Button>
  );
}
