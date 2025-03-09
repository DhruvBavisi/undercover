import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket;

export const initSocket = () => {
  if (socket) return socket;

  console.log('Initializing socket connection to:', SOCKET_URL);
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    withCredentials: true
  });

  // Make socket available globally
  window.socket = socket;

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export default { initSocket, getSocket };
