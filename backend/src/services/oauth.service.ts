import axios from 'axios';
import { config } from '../config/env';
import { GoogleProfile } from '../types/user.types';
import logger from '../utils/logger';

export interface IOAuthService {
  getGoogleAuthUrl(state: string): string;
  handleGoogleCallback(code: string, state: string): Promise<GoogleProfile>;
}

export class OAuthService implements IOAuthService {
  private googleClientId: string;
  private googleClientSecret: string;
  private googleRedirectUri: string;

  constructor() {
    this.googleClientId = config.googleClientId;
    this.googleClientSecret = config.googleClientSecret;
    this.googleRedirectUri = config.googleRedirectUri;
  }

  getGoogleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, _state: string): Promise<GoogleProfile> {
    try {
      // 1. Exchange code for tokens
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        redirect_uri: this.googleRedirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // 2. Get user profile
      const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      return {
        id: profileResponse.data.id,
        email: profileResponse.data.email,
        name: profileResponse.data.name,
        picture: profileResponse.data.picture,
      };
    } catch (error) {
      logger.error('Google OAuth error', { error });
      throw new Error('Google OAuth failed');
    }
  }
}
