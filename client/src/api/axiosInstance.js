// client/src/api/axiosInstance.js
import axios from 'axios';

// All API calls go through this instance — baseURL and JWT are set once here
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attaches the JWT to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;