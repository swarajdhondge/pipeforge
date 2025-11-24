import api from './api';

export type AvatarUploadMethod = 'PUT' | 'POST' | 'INLINE';

export interface AvatarUploadResponse {
  uploadUrl: string;
  publicUrl?: string;
  headers?: Record<string, string>;
  method: AvatarUploadMethod;
  formField?: string;
}

export const storageService = {
  getAvatarUploadUrl: async (mimeType: string, size: number) => {
    const response = await api.post<AvatarUploadResponse>('/storage/avatar/upload-url', {
      mimeType,
      size,
    });
    return response.data;
  },
};
