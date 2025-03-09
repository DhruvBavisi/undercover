import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket;

export const initSocket = () => {
  if (socket) {
    return socket;
  }
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // Make socket available globally
    window.socket = socket;
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};
