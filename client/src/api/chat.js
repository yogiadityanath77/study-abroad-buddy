// client/src/api/chat.js
import axiosInstance from './axiosInstance';

// Fetches the last 30 messages for the logged-in user
const getChatHistory = async () => {
  const response = await axiosInstance.get('/api/chat/history');
  return response.data;
};

// Sends a message and returns both the user message and bot reply
const sendMessage = async (message) => {
  const response = await axiosInstance.post('/api/chat/message', { message });
  return response.data;
};

export { getChatHistory, sendMessage };