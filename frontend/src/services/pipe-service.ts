import api from './api';

export interface Pipe {
  id: string;
  user_id: string;
  name: string;
  description: string;
  definition: {
    nodes: any[];
    edges: any[];
  };
  is_public: boolean;
  is_draft: boolean;
  tags: string[];
  like_count: number;
  execution_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email: string;
    name?: string;
    displayName?: string;
  };
  is_liked?: boolean;
}

export interface ListPipesParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  sort?: 'popular' | 'recent' | 'most_used';
  user_id?: string;
  is_public?: boolean;
}

export interface ListPipesResponse {
  items: Pipe[];
  total: number;
  page: number;
  limit: number;
}

export const pipeService = {
  // List pipes with filters
  list: async (params: ListPipesParams = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());
    
    return api.get<ListPipesResponse>(`/pipes?${queryParams.toString()}`);
  },

  // Get pipe by ID
  get: async (pipeId: string) => {
    return api.get<Pipe>(`/pipes/${pipeId}`);
  },

  // Create pipe
  create: async (data: {
    name: string;
    description?: string;
    definition: any;
    is_public?: boolean;
    is_draft?: boolean;
    tags?: string[];
  }) => {
    return api.post<Pipe>('/pipes', data);
  },

  // Update pipe
  update: async (pipeId: string, data: {
    name?: string;
    description?: string;
    definition?: any;
    is_public?: boolean;
    is_draft?: boolean;
    tags?: string[];
  }) => {
    return api.put<Pipe>(`/pipes/${pipeId}`, data);
  },

  // Delete pipe
  delete: async (pipeId: string) => {
    return api.delete(`/pipes/${pipeId}`);
  },

  // Fork pipe
  fork: async (pipeId: string) => {
    return api.post<Pipe>(`/pipes/${pipeId}/fork`);
  },

  // Like pipe
  like: async (pipeId: string) => {
    return api.post<{ like_count: number }>(`/pipes/${pipeId}/like`);
  },

  // Unlike pipe
  unlike: async (pipeId: string) => {
    return api.delete<{ like_count: number }>(`/pipes/${pipeId}/like`);
  },

  // Get trending pipes
  getTrending: async (limit: number = 10) => {
    return api.get<{ items: Pipe[] }>(`/pipes/trending?limit=${limit}`);
  },

  // Get featured pipes
  getFeatured: async (limit: number = 10) => {
    return api.get<{ items: Pipe[] }>(`/pipes/featured?limit=${limit}`);
  },

  // Get version history
  getVersions: async (pipeId: string) => {
    return api.get<{ versions: Array<{ version_number: number; created_at: string }> }>(
      `/pipes/${pipeId}/versions`
    );
  },

  // Restore version
  restoreVersion: async (pipeId: string, versionNumber: number) => {
    return api.post<Pipe>(`/pipes/${pipeId}/versions/${versionNumber}/restore`);
  },
};
