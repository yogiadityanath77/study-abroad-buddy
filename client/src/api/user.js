import axiosInstance from './axiosInstance';

// Returns the logged-in user's full profile.
const getProfile = async () => {
  const response = await axiosInstance.get('/api/user/profile');
  return response.data;
};

// Updates one or more profile fields.
const updateProfile = async (profileData) => {
  const response = await axiosInstance.patch('/api/user/profile', profileData);
  return response.data;
};

// Returns the AI-generated checklist items and the user's ticked items.
const getChecklist = async () => {
  const response = await axiosInstance.get('/api/user/checklist');
  return response.data;
};

// Replaces the user's ticked dashboard checklist items array.
const updateChecklist = async (checklist) => {
  const response = await axiosInstance.patch('/api/user/checklist', { checklist });
  return response.data;
};

// Persists ticked visa docs and/or vaccine items to the user profile.
// Pass only the field(s) you want to update — the other is ignored by the server.
const updateTickedItems = async (fields) => {
  const response = await axiosInstance.patch('/api/user/profile', fields);
  return response.data;
};

export { getProfile, updateProfile, getChecklist, updateChecklist, updateTickedItems };