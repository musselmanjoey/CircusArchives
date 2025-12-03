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

// Video types
export interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  year: number;
  description?: string;
  actId: string;
  act?: Act;
  uploaderId?: string;
  uploader?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCreateInput {
  youtubeUrl: string;
  title: string;
  year: number;
  description?: string;
  actId: string;
}

// Act types
export interface Act {
  id: string;
  name: string;
  description?: string;
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
