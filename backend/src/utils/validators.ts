import validator from 'validator';
import { ValidationError } from '../errors/auth.errors';
import { RegisterRequest, LoginRequest, UpdateProfileRequest } from '../types/user.types';

// Common email domain typos and their corrections
const EMAIL_TYPO_MAP: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmailcom': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  // Hotmail typos
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icoud.com': 'icloud.com',
};

/**
 * Check for common email domain typos
 * @param email - Email address to check
 * @returns Suggested correction or null if no typo detected
 */
function detectEmailTypo(email: string): string | null {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return null;
  
  const domain = parts[1];
  const correction = EMAIL_TYPO_MAP[domain];
  
  if (correction) {
    return correction;
  }
  
  return null;
}

export function validateRegisterInput(data: unknown): RegisterRequest {
  // 1. Check data exists and is object
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid input');
  }

  const { email, password, localPipes } = data as any;

  // 2. Check required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // 3. Validate types
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('Email and password must be strings');
  }

  // 4. Validate email format
  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // 5. Check for common email typos
  const suggestedDomain = detectEmailTypo(email);
  if (suggestedDomain) {
    const [localPart] = email.split('@');
    throw new ValidationError(
      `Did you mean ${localPart}@${suggestedDomain}? Please check your email address.`
    );
  }

  // 6. Validate password constraints
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  if (password.length > 100) {
    throw new ValidationError('Password must be less than 100 characters');
  }

  // 7. Sanitize email
  const sanitizedEmail = validator.normalizeEmail(email) || email;

  // 8. Validate localPipes if provided
  if (localPipes !== undefined && !Array.isArray(localPipes)) {
    throw new ValidationError('localPipes must be an array');
  }

  // 9. Return typed object
  return {
    email: sanitizedEmail,
    password: password,
    localPipes: localPipes || [],
  };
}

export function validateLoginInput(data: unknown): LoginRequest {
  // 1. Check data exists and is object
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid input');
  }

  const { email, password, localPipes } = data as any;

  // 2. Check required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // 3. Validate types
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('Email and password must be strings');
  }

  // 4. Validate email format
  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // 5. Check for common email typos
  const suggestedDomain = detectEmailTypo(email);
  if (suggestedDomain) {
    const [localPart] = email.split('@');
    throw new ValidationError(
      `Did you mean ${localPart}@${suggestedDomain}? Please check your email address.`
    );
  }

  // 6. Sanitize email
  const sanitizedEmail = validator.normalizeEmail(email) || email;

  // 7. Validate localPipes if provided
  if (localPipes !== undefined && !Array.isArray(localPipes)) {
    throw new ValidationError('localPipes must be an array');
  }

  // 8. Return typed object
  return {
    email: sanitizedEmail,
    password: password,
    localPipes: localPipes || [],
  };
}

export function validateUpdateProfileInput(data: unknown): UpdateProfileRequest {
  // 1. Check data exists and is object
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid input');
  }

  const { name, bio, avatar_url } = data as any;

  // 2. Validate name if provided
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      throw new ValidationError('Name must be a string');
    }
    if (name.trim().length === 0) {
      // Allow empty string to clear name
      // Will be converted to undefined below
    } else if (name.length > 255) {
      throw new ValidationError('Name must be less than 255 characters');
    }
  }

  // 3. Validate bio if provided
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== 'string') {
      throw new ValidationError('Bio must be a string');
    }
    if (bio.trim().length === 0) {
      // Allow empty string to clear bio
      // Will be converted to undefined below
    } else if (bio.length > 1000) {
      throw new ValidationError('Bio must be less than 1000 characters');
    }
  }

  // 4. Validate avatar if provided (skip if null, undefined, or empty string - these mean "remove avatar")
  if (avatar_url !== undefined && avatar_url !== null && avatar_url !== '') {
    if (typeof avatar_url !== 'string') {
      throw new ValidationError('Avatar must be a string');
    }

    const trimmedAvatar = avatar_url.trim();
    
    // Skip validation if empty after trimming (means remove avatar)
    if (trimmedAvatar) {
      const isDataUrl = trimmedAvatar.startsWith('data:image/');
      const isHttpUrl = validator.isURL(trimmedAvatar, { protocols: ['http', 'https'], require_protocol: true });

      if (!isDataUrl && !isHttpUrl) {
        throw new ValidationError('Avatar must be a valid image URL (data:, http://, or https://)');
      }

      if (trimmedAvatar.length > 500_000) {
        throw new ValidationError('Avatar is too large. Please use a smaller image.');
      }
    }
  }

  // 5. Return typed object (convert empty strings to null for removal)
  const trimmedAvatarUrl = avatar_url?.toString().trim();
  return {
    name: name && name.trim() ? name : undefined,
    bio: bio && bio.trim() ? bio : undefined,
    avatar_url: avatar_url === null ? null : (trimmedAvatarUrl || undefined),
  };
}

export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
