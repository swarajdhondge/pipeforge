import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: 'development' | 'production';
  databaseUrl: string;
  databasePoolSize: number;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  frontendUrl: string;
  corsOrigins: string[];
  rateLimitLoginAttempts: number;
  rateLimitLoginWindow: number;
  rateLimitRegisterAttempts: number;
  rateLimitRegisterWindow: number;
  secretsEncryptionKey: string;
  domainWhitelist: string[];
  storageProvider: 'database' | 's3' | 'disk';
  maxAvatarSizeBytes: number;
  storageDiskRoot: string;
  storageDiskAvatarPath: string;
  storagePublicBaseUrl: string;
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    forcePathStyle: boolean;
    publicBaseUrl: string;
  };
}

function loadConfig(): Config {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FRONTEND_URL',
    'SECRETS_ENCRYPTION_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Validate SECRETS_ENCRYPTION_KEY format
  const secretsKey = process.env.SECRETS_ENCRYPTION_KEY!;
  if (secretsKey.length !== 64) {
    throw new Error('SECRETS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(secretsKey)) {
    throw new Error('SECRETS_ENCRYPTION_KEY must contain only hexadecimal characters');
  }

  // Default domain whitelist - includes popular data sources
  const defaultWhitelist = [
    // Original APIs
    'api.github.com',
    'jsonplaceholder.typicode.com',
    'api.openweathermap.org',
    'api.exchangerate-api.com',
    'restcountries.com',
    'raw.githubusercontent.com', // For CSV test data
    'hnrss.org', // For RSS test feeds
    // Template sources (must match seed-db.ts templates)
    'api.open-meteo.com', // Weather Dashboard template
    'rss.nytimes.com', // Tech News Feed template
    'dev.to', // DEV.to API template
    // Social platforms
    'medium.com', // Medium RSS feeds
    'reddit.com', // Reddit JSON API
    'www.reddit.com', // Reddit with www prefix
    'old.reddit.com', // Old Reddit
    'news.ycombinator.com', // Hacker News
    'hacker-news.firebaseio.com', // HN Firebase API
    // Other popular sources
    'en.wikipedia.org', // Wikipedia English
    'api.wikipedia.org', // Wikipedia API
    'www.youtube.com', // YouTube RSS feeds
  ];

  const storageProvider = (process.env.STORAGE_PROVIDER as 'database' | 's3' | 'disk') || 'database';
  const maxAvatarSizeBytes = parseInt(process.env.MAX_AVATAR_SIZE_BYTES || `${2 * 1024 * 1024}`, 10);
  const storageDiskRoot = process.env.STORAGE_DISK_ROOT
    ? path.resolve(process.env.STORAGE_DISK_ROOT)
    : path.resolve(process.cwd(), 'uploads');
  const storageDiskAvatarPath = process.env.STORAGE_DISK_AVATAR_PATH
    ? path.resolve(process.env.STORAGE_DISK_AVATAR_PATH)
    : path.join(storageDiskRoot, 'avatars');
  const storagePublicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL || '/uploads';

  let s3Config: Config['s3'];
  if (storageProvider === 's3') {
    const requiredS3 = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
    for (const key of requiredS3) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable for S3 storage: ${key}`);
      }
    }

    const bucket = process.env.S3_BUCKET!;
    const region = process.env.S3_REGION!;
    const endpoint = process.env.S3_ENDPOINT;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || !!endpoint;
    const publicBaseUrl =
      process.env.S3_PUBLIC_BASE_URL ||
      (endpoint
        ? `${endpoint.replace(/\/$/, '')}/${bucket}`
        : `https://${bucket}.s3.${region}.amazonaws.com`);

    s3Config = {
      bucket,
      region,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      endpoint,
      forcePathStyle,
      publicBaseUrl,
    };
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    databaseUrl: process.env.DATABASE_URL!,
    databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
    redisUrl: process.env.REDIS_URL!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
    frontendUrl: process.env.FRONTEND_URL!,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    rateLimitLoginAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || '5', 10),
    rateLimitLoginWindow: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '60000', 10),
    rateLimitRegisterAttempts: parseInt(process.env.RATE_LIMIT_REGISTER_ATTEMPTS || '3', 10),
    rateLimitRegisterWindow: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW || '60000', 10),
    secretsEncryptionKey: secretsKey,
    domainWhitelist: process.env.DOMAIN_WHITELIST?.split(',').map(d => d.trim()) || defaultWhitelist,
    storageProvider,
    maxAvatarSizeBytes,
    storageDiskRoot,
    storageDiskAvatarPath,
    storagePublicBaseUrl,
    s3: s3Config,
  };
}

export const config = loadConfig();
