import axios from 'axios';

// Use relative URLs for Next.js API routes (same origin)
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to handle FormData properly
api.interceptors.request.use((config) => {
  // If data is FormData, remove Content-Type header so axios can set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Add auth token to requests
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

// Load token from localStorage on init
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    setAuthToken(token);
  }
}

export default api;

