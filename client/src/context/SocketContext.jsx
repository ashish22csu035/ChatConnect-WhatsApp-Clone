import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      console.log('🔌 Connecting to socket:', socketURL);
      
      const newSocket = io(socketURL, {
        withCredentials: true
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        newSocket.emit('user-online', user._id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      return () => {
        console.log('🔌 Disconnecting socket');
        newSocket.disconnect();
      };
    }
  }, [user]);

  const value = {
    socket
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};