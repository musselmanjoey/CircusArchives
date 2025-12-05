'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoteButton } from './VoteButton';
import { VotersList } from './VotersList';
import type { VoteWithDetails, ApiResponse } from '@/types';

interface VoteInfoProps {
  videoId: string;
  actId: string;
  actName: string;
}

export function VoteInfo({ videoId, actId, actName }: VoteInfoProps) {
  const [voteCount, setVoteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVoteCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/voters`);
      if (response.ok) {
        const data: ApiResponse<VoteWithDetails[]> = await response.json();
        // Calculate total vote weight
        const totalWeight = (data.data || []).reduce(
          (sum, voter) => sum + voter.voteWeight,
          0
        );
        setVoteCount(totalWeight);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVoteCount();
  }, [fetchVoteCount]);

  const handleVoteChange = () => {
    fetchVoteCount();
  };

  return (
    <div className="flex items-center gap-4">
      <VoteButton
        videoId={videoId}
        actId={actId}
        actName={actName}
        onVoteChange={handleVoteChange}
      />
      {!isLoading && <VotersList videoId={videoId} voteCount={voteCount} />}
    </div>
  );
}
