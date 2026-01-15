// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Performer (simplified user for tagging)
export interface Performer {
  id: string;
  firstName: string;
  lastName: string;
}

// Video Performer join
export interface VideoPerformer {
  id: string;
  videoId: string;
  userId: string;
  user: Performer;
  createdAt: Date;
}

// V5: Show type enum
export type ShowType = 'HOME' | 'CALLAWAY';

// V5: Video-Act join
export interface VideoAct {
  id: string;
  videoId: string;
  actId: string;
  act: Act;
  createdAt: Date;
}

// Video types
export interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  year: number;
  description?: string;
  showType: ShowType;
  // V6: Flag for videos needing performer tags (set by discovery tool)
  needsPerformers?: boolean;
  // V5: Multiple acts via join table
  acts?: VideoAct[];
  // Legacy single act (for backward compat during transition)
  act?: Act;
  uploaderId?: string;
  uploader?: Performer | null;
  performers?: VideoPerformer[];
  voteCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCreateInput {
  youtubeUrl: string;
  year: number;
  description?: string;
  showType: ShowType;
  actIds: string[];
  performerIds?: string[];
}

// Act types
export interface Act {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Search/Filter types
export interface VideoFilters {
  actId?: string;
  year?: number;
  search?: string;
  performerId?: string;
  showType?: ShowType;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// V4: Comment types
export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: Performer;
  videoId: string;
  video?: Video;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentCreateInput {
  content: string;
  videoId: string;
}

export interface CommentUpdateInput {
  content: string;
}

// V3: Voting types
export interface Vote {
  id: string;
  userId: string;
  user?: Performer;
  videoId: string;
  video?: Video;
  actId: string;
  act?: Act;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteWithDetails extends Vote {
  isPerformer: boolean;
  voteWeight: number;
}

export interface VideoRanking {
  videoId: string;
  video: Video;
  actId: string;
  act: Act;
  voteCount: number;
  voterCount: number;
}

export interface ActRanking {
  act: Act;
  topVideo: Video | null;
  totalVotes: number;
}

// Homepage rankings response
export interface HomepageRankings {
  topVideos: TopVideo[];
  acts: ActRanking[];
}

// Top video for homepage display
export interface TopVideo {
  video: Video;
  act: Act;
  voteCount: number;
}

// V6: Upload Queue types
export type UploadStatus = 'PENDING' | 'UPLOADED' | 'FAILED';

export interface UploadQueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  blobUrl: string;
  title: string;
  year: number;
  description?: string;
  showType: ShowType;
  actIds: string[];
  performerIds: string[];
  status: UploadStatus;
  youtubeUrl?: string;
  errorMessage?: string;
  uploaderId: string;
  uploader?: Performer;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface UploadQueueCreateInput {
  fileName: string;
  fileSize: number;
  blobUrl: string;
  title: string;
  year: number;
  description?: string;
  showType: ShowType;
  actIds: string[];
  performerIds?: string[];
}

export interface UploadQueueUpdateInput {
  status?: UploadStatus;
  youtubeUrl?: string;
  errorMessage?: string;
}

// Discovery Tool types
export type DiscoveryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUSHED';

export interface DiscoveredVideo {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  rawTitle: string;
  rawDescription?: string;
  channelName?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  inferredYear?: number;
  inferredShowType?: string;
  inferredActNames: string[];
  inferredPerformers: string[];
  inferredPerformerIds?: string[];
  status: DiscoveryStatus;
  reviewNotes?: string;
  prodVideoId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveredVideoUpdateInput {
  inferredYear?: number;
  inferredShowType?: string;
  inferredActNames?: string[];
  inferredPerformers?: string[];
  inferredPerformerIds?: string[];
  status?: DiscoveryStatus;
  reviewNotes?: string;
}
