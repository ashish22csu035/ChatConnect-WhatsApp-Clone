import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("VITE_API_URL is not defined!");
}


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json'
  }
});


export const authAPI = {
 
  getCurrentUser: () => api.get('/auth/me'),

  
  logout: () => api.post('/auth/logout')
};


export const chatAPI = {
  getUsers: () => api.get('/chat/users'),
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (data) => api.post('/chat/messages', data),
  markAsRead: (userId) => api.put(`/chat/messages/read/${userId}`)
};

export default api;
