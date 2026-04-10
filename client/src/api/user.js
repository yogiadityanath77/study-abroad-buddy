// client/src/api/user.js
import axiosInstance from './axiosInstance';

// Fetches the logged-in user's profile
const getProfile = async () => {
  const response = await axiosInstance.get('/api/user/profile');
  return response.data;
};

// Updates the logged-in user's profile fields
const updateProfile = async (profileData) => {
  const response = await axiosInstance.patch('/api/user/profile', profileData);
  return response.data;
};

// Replaces the user's checklist with a new array
const updateChecklist = async (checklist) => {
  const response = await axiosInstance.patch('/api/user/checklist', { checklist });
  return response.data;
};

export { getProfile, updateProfile, updateChecklist };