const config = {
  apiUrl: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://undercover-1n9q.onrender.com/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'https://undercover-1n9q.onrender.com',
  isDevelopment: import.meta.env.DEV || false,
};

export default config; 