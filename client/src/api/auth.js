// client/src/api/auth.js
import axiosInstance from './axiosInstance';

// Sends register request and returns token + user
const registerUser = async (name, email, password) => {
  const response = await axiosInstance.post('/api/auth/register', {
    name,
    email,
    password,
  });
  return response.data;
};

// Sends login request and returns token + user
const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
};

export { registerUser, loginUser };