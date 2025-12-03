import { PipeDefinition } from './operator.types';

export interface Pipe {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  definition: PipeDefinition;
  is_public: boolean;
  is_draft: boolean;
  tags: string[];
  like_count: number;
  execution_count: number;
  is_featured: boolean;
  forked_from: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PipeVersion {
  id: string;
  pipe_id: string;
  version_number: number;
  definition: PipeDefinition;
  created_at: Date;
}

export interface CreatePipeInput {
  user_id: string | null;
  name: string;
  description?: string;
  definition: PipeDefinition;
  is_public?: boolean;
  is_draft?: boolean;
  tags?: string[];
}

export interface UpdatePipeInput {
  name?: string;
  description?: string;
  definition?: PipeDefinition;
  is_public?: boolean;
  is_draft?: boolean;
  tags?: string[];
}
