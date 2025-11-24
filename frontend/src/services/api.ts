import axios from 'axios';

// Create axios instance
// Use relative path for gateway compatibility, or VITE_API_URL for local dev
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pipe_forge_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to check if endpoint supports optional authentication
const isOptionalAuthEndpoint = (url: string): boolean => {
  const optionalAuthPatterns = [
    '/pipes',
    '/executions',
    '/trending',
    '/featured',
  ];
  
  return optionalAuthPatterns.some(pattern => url.includes(pattern));
};

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't trigger session expired for login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register');

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const isOptionalAuth = isOptionalAuthEndpoint(originalRequest.url || '');
      const refreshToken = localStorage.getItem('pipe_forge_refresh_token');

      // Try to refresh token if available
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Update tokens
          localStorage.setItem('pipe_forge_access_token', accessToken);
          localStorage.setItem('pipe_forge_refresh_token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed
          localStorage.removeItem('pipe_forge_access_token');
          localStorage.removeItem('pipe_forge_refresh_token');

          // If optional auth endpoint, retry without Authorization header
          if (isOptionalAuth) {
            delete originalRequest.headers.Authorization;
            return api(originalRequest);
          }

          // If protected endpoint, trigger session expired modal
          window.dispatchEvent(new CustomEvent('session-expired'));
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        // If optional auth endpoint, retry without Authorization header
        if (isOptionalAuth) {
          delete originalRequest.headers.Authorization;
          return api(originalRequest);
        }

        // Only trigger session expired if user was previously authenticated
        const wasAuthenticated = localStorage.getItem('pipe_forge_access_token');
        if (wasAuthenticated) {
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
