import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 🔥 Add JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem("token");
    return api.post('/auth/logout');
  }
};

export const chatAPI = {
  getUsers: () => api.get('/chat/users'),
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (data) => api.post('/chat/messages', data),
  markAsRead: (userId) => api.put(`/chat/messages/read/${userId}`)
};

export default api;
