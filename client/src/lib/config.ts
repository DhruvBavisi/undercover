const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  vercelUrl: import.meta.env.VITE_VERCEL_URL || 'https://undercover-game.vercel.app'
};

export default config;
