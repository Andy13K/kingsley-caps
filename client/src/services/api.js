import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message || error.message || 'Error de red';
    return Promise.reject(new Error(message));
  }
);

export default api;
