import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSocket } from '../utils/socket';
import { SOCKET_URL } from '../config';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = initSocket();
    
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
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
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 