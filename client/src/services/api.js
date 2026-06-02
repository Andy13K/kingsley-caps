import axios from 'axios';

// In production (Render) frontend and backend share the same origin → empty string = relative URLs.
// In development set VITE_API_URL=http://127.0.0.1:3002 in client/.env.local
const API_URL = import.meta.env.VITE_API_URL ?? '';
const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? API_URL;

export const authApi = axios.create({ baseURL: AUTH_URL });

const api = axios.create({ baseURL: `${API_URL}/api` });

export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setTokens = (access, refresh) => {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      const message = error.response?.data?.error?.message || error.message || 'Error de red';
      return Promise.reject(new Error(message));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const rawRefresh = getRefreshToken();
      if (!rawRefresh) throw new Error('No refresh token');

      const { data } = await authApi.post('/api/auth/refresh', { refreshToken: rawRefresh });
      const { accessToken, refreshToken } = data.data;

      setTokens(accessToken, refreshToken);
      processQueue(null, accessToken);

      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
