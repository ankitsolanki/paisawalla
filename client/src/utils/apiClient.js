import axios from 'axios';
import { retryWithBackoff } from './retry';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.VITE_API_BASE_URL) return window.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  return '';
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here if needed
    // Add session ID if available
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionId = sessionStorage.getItem('pw_session_id');
      if (sessionId) {
        config.headers['X-Session-Id'] = sessionId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for network errors and 5xx errors
    if (
      !originalRequest._retry &&
      (!error.response || (error.response.status >= 500 && error.response.status < 600))
    ) {
      originalRequest._retry = true;
      
      try {
        return await retryWithBackoff(() => apiClient(originalRequest), 2, 1000);
      } catch (retryError) {
        const errorMessage = retryError.response?.data?.message || retryError.message || 'An error occurred';
        return Promise.reject(new Error(errorMessage));
      }
    }

    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

