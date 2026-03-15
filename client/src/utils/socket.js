import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket;

export const initSocket = () => {
  if (socket) return socket;

  console.log('Initializing socket connection to:', SOCKET_URL);

  // Detect Safari and use polling-first strategy
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const socketOptions = {
    reconnection: true,
    reconnectionAttempts: Infinity,      // Never stop trying
    reconnectionDelay: 1000,             // Start with 1s delay
    reconnectionDelayMax: 5000,          // Cap at 5s
    timeout: 10000,
    transports: isSafari
      ? ['polling', 'websocket']   // polling first for Safari
      : ['websocket', 'polling'],  // websocket first for others
    autoConnect: true,
    withCredentials: true,
    randomizationFactor: 0.5
  };

  socket = io(SOCKET_URL, socketOptions);

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
