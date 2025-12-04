import { Router, Response } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { StorageService } from '../services/storage.service';
import logger from '../utils/logger';
import { config } from '../config/env';

export function createStorageRoutes(storageService: StorageService) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxAvatarSizeBytes } });

  // POST /storage/avatar/upload-url - get a presigned URL for avatar upload
  router.post('/avatar/upload-url', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { mimeType, size } = req.body as { mimeType?: string; size?: number };

      if (!mimeType) {
        return res.status(400).json({ error: 'mimeType is required' });
      }

      const fileSize = typeof size === 'number' ? size : 0;
      const uploadUrl = await storageService.createAvatarUploadUrl(userId, mimeType, fileSize);

      return res.json(uploadUrl);
    } catch (error: any) {
      logger.error('Failed to create avatar upload URL', { error });
      const msg = error?.message || 'Failed to create upload URL';
      if (error?.statusCode === 400 || error?.name === 'ValidationError') {
        return res.status(400).json({ error: msg });
      }
      return res.status(500).json({ error: msg });
    }
  });

  // POST /storage/avatar/direct/:key - direct upload for disk provider
  router.post('/avatar/direct/:key(*)', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const key = decodeURIComponent(req.params.key);
      // Key format is avatars/{userId}/{uuid}.{ext}
      if (!key.startsWith(`avatars/${req.user!.userId}/`)) {
        return res.status(403).json({ error: 'Invalid upload key' });
      }

      const result = await storageService.saveDiskAvatar(key, req.file.buffer, req.file.mimetype);
      return res.json(result);
    } catch (error: any) {
      logger.error('Disk avatar upload failed', { error });
      const msg = error?.message || 'Failed to upload avatar';
      if (error?.statusCode === 400 || error?.name === 'ValidationError') {
        return res.status(400).json({ error: msg });
      }
      return res.status(500).json({ error: msg });
    }
  });

  return router;
}
