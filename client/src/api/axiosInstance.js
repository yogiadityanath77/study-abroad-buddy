// client/src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attaches JWT Bearer token to every outgoing request.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalises all error responses so every catch block can reliably read err.message.
// Without this, network errors have a different shape to server errors.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Server responded with a non-2xx status — use the server's message if available.
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    // Network error or server completely unreachable.
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    // Fallback for unexpected error shapes.
    return Promise.reject(new Error('Something went wrong. Please try again.'));
  }
);

export default axiosInstance;