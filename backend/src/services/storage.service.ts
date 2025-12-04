import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { config } from '../config/env';
import { ValidationError } from '../errors/auth.errors';

export type AvatarUploadMethod = 'PUT' | 'POST' | 'INLINE';

export interface AvatarUploadUrl {
  uploadUrl: string;
  publicUrl?: string;
  headers?: Record<string, string>;
  method: AvatarUploadMethod;
  formField?: string;
  key?: string;
}

export class StorageService {
  private s3Client: any = null;
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  constructor() {
    // S3 client is initialized lazily when needed
  }

  private async initS3Client() {
    if (this.s3Client) return this.s3Client;
    
    if (config.storageProvider !== 's3' || !config.s3) {
      throw new ValidationError('S3 storage is not configured.');
    }

    // Dynamic import - only loads when S3 is actually used
    const { S3Client } = await import('@aws-sdk/client-s3');
    
    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
    });
    
    return this.s3Client;
  }

  private validateFile(mimeType: string, contentLength: number) {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new ValidationError('Invalid image type. Allowed: JPEG, PNG, GIF, WEBP.');
    }

    if (contentLength > config.maxAvatarSizeBytes) {
      throw new ValidationError(`File too large. Max ${(config.maxAvatarSizeBytes / 1024 / 1024).toFixed(1)}MB.`);
    }
  }

  private buildAvatarKey(userId: string, mimeType: string): string {
    const ext = mime.extension(mimeType) || 'bin';
    return `avatars/${userId}/${randomUUID()}.${ext}`;
  }

  // Database mode: no remote upload, caller should fallback to inline
  private createInlineDescriptor(): AvatarUploadUrl {
    return {
      uploadUrl: '',
      method: 'INLINE',
    };
  }

  private async createS3Presign(userId: string, mimeType: string, contentLength: number): Promise<AvatarUploadUrl> {
    if (!config.s3) {
      throw new ValidationError('Cloud storage is not enabled. Set STORAGE_PROVIDER=s3 to use uploads.');
    }

    this.validateFile(mimeType, contentLength);
    
    // Dynamic imports for S3
    const [{ PutObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);
    
    const client = await this.initS3Client();
    const s3 = config.s3;
    const key = this.buildAvatarKey(userId, mimeType);

    const command = new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 minutes
    const publicUrl = `${s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      headers: {
        'Content-Type': mimeType,
      },
      method: 'PUT',
      key,
    };
  }

  private async ensureDiskPaths() {
    await fs.mkdir(config.storageDiskAvatarPath, { recursive: true });
  }

  private async createDiskDescriptor(userId: string, mimeType: string, contentLength: number): Promise<AvatarUploadUrl> {
    this.validateFile(mimeType, contentLength);
    await this.ensureDiskPaths();

    const key = this.buildAvatarKey(userId, mimeType);
    const uploadUrl = `/api/v1/storage/avatar/direct/${encodeURIComponent(key)}`;
    const publicUrl = `${config.storagePublicBaseUrl.replace(/\/$/, '')}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      method: 'POST',
      formField: 'file',
      key,
    };
  }

  async createAvatarUploadUrl(userId: string, mimeType: string, contentLength: number): Promise<AvatarUploadUrl> {
    if (config.storageProvider === 'database') {
      return this.createInlineDescriptor();
    }

    if (config.storageProvider === 's3') {
      return this.createS3Presign(userId, mimeType, contentLength);
    }

    // disk
    return this.createDiskDescriptor(userId, mimeType, contentLength);
  }

  // Used by disk provider to persist the uploaded buffer
  async saveDiskAvatar(key: string, buffer: Buffer, mimeType: string) {
    if (config.storageProvider !== 'disk') {
      throw new ValidationError('Disk storage is not enabled.');
    }
    this.validateFile(mimeType, buffer.length);

    const safeKey = key.replace(/(\.\.)|(^\/)/g, '');
    const targetPath = path.join(config.storageDiskAvatarPath, safeKey);
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `${config.storagePublicBaseUrl.replace(/\/$/, '')}/${safeKey}`;
    return { publicUrl };
  }
}
