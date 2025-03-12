import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSocket } from '../utils/socket';
import { SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const newSocket = initSocket();
    
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Authenticate socket with user ID if logged in
      if (isAuthenticated && user?.id) {
        console.log('Authenticating socket with user ID:', user.id);
        newSocket.emit('authenticate', { userId: user.id });
      }
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    
    const onError = (error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    };
    
    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onError);
    
    setSocket(newSocket);
    
    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onError);
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user?.id) {
      console.log('Re-authenticating socket with user ID:', user.id);
      socket.emit('authenticate', { userId: user.id });
    }
  }, [socket, isConnected, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 