import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API calls
export const authAPI = {
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Logout
  logout: () => api.post('/auth/logout')
};

// Chat API calls
export const chatAPI = {
  // Get all users
  getUsers: () => api.get('/chat/users'),
  
  // Get messages with a user
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  
  // Send message
  sendMessage: (data) => api.post('/chat/messages', data),
  
  // Mark messages as read
  markAsRead: (userId) => api.put(`/chat/messages/read/${userId}`)
};

export default api;