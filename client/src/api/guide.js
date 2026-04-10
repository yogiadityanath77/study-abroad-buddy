// client/src/api/guide.js
import axiosInstance from './axiosInstance';

// Fetches the guide for the given type: visa | health | culture | housing
const getGuide = async (type) => {
  const response = await axiosInstance.get(`/api/guide/${type}`);
  return response.data;
};

export { getGuide };
