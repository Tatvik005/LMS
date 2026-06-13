import axios from 'axios';

let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

const apiClient = axios.create({
  baseURL: 'http://localhost:5005/api',
  withCredentials: true, // Crucial for sending/receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add Authorization header dynamically
apiClient.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle token refresh logic (if implementing silent refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Basic retry logic for 401s if we want to hit the refresh endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login or handle session expiry
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/dashboard'; // Redirect on unauthorized
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
