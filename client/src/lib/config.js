const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  isDevelopment: import.meta.env.DEV || false,
};

export default config; 